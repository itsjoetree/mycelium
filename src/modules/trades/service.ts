import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../db';
import { users, trades, tradeItems, resources } from '../../db/schema';
import { eq, inArray, and, or, desc, not } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { WebSocketManager } from '../../lib/ws';
import { tradeQueue } from '../../lib/queue';

const MAX_TOTAL_QUANTITY_PER_TRADE = 1000;

const initiators = alias(users, 'initiators');
const receivers = alias(users, 'receivers');

export class TradeService {
    static async getTrades(userId: number) {
        const results = await db
            .select({
                id: trades.id,
                initiatorId: trades.initiatorId,
                receiverId: trades.receiverId,
                status: trades.status,
                createdAt: trades.createdAt,
                initiatorUsername: initiators.username,
                receiverUsername: receivers.username,
                resourceTitle: resources.title,
                resourceQuantity: resources.quantity,
                resourceUnit: resources.unit,
                resourceOwnerId: resources.ownerId,
                resourceType: resources.type,
            })
            .from(trades)
            .leftJoin(initiators, eq(trades.initiatorId, initiators.id))
            .leftJoin(receivers, eq(trades.receiverId, receivers.id))
            .leftJoin(tradeItems, eq(trades.id, tradeItems.tradeId))
            .leftJoin(resources, eq(tradeItems.resourceId, resources.id))
            .where(
                or(
                    eq(trades.initiatorId, userId),
                    eq(trades.receiverId, userId)
                )
            )
            .orderBy(desc(trades.createdAt));

        // Group by trade ID to collect resource details
        const tradesMap = new Map();
        for (const row of results) {
            if (!tradesMap.has(row.id)) {
                tradesMap.set(row.id, {
                    ...row,
                    resources: [],
                });
            }
            if (row.resourceTitle) {
                tradesMap.get(row.id).resources.push({
                    title: row.resourceTitle,
                    quantity: row.resourceQuantity,
                    unit: row.resourceUnit,
                    ownerId: row.resourceOwnerId,
                    type: row.resourceType,
                });
            }
        }

        return Array.from(tradesMap.values()).map(t => {
            const { resourceTitle, resourceQuantity, resourceUnit, resourceOwnerId, resourceType, ...rest } = t;
            return rest;
        });
    }

    static async createTrade(initiatorId: number, receiverId: number, resourceIds: number[]) {
        return await db.transaction(async (tx) => {
            // 0. Prevent duplicate pending trades for these resources by the same initiator
            const existingPending = await tx
                .select({ id: trades.id })
                .from(trades)
                .innerJoin(tradeItems, eq(trades.id, tradeItems.tradeId))
                .where(
                    and(
                        eq(trades.initiatorId, initiatorId),
                        eq(trades.status, 'PENDING'),
                        inArray(tradeItems.resourceId, resourceIds)
                    )
                );

            if (existingPending.length > 0) {
                throw new HTTPException(400, { message: 'You already have a pending proposal for one or more of these resources' });
            }

            // 1. Verify all resources exist and belong to either initiator or receiver

            const foundResources = await tx
                .select()
                .from(resources)
                .where(inArray(resources.id, resourceIds));

            if (foundResources.length !== resourceIds.length) {
                throw new HTTPException(400, { message: 'One or more resources not found' });
            }

            // Check if any resource is not available
            const unavailable = foundResources.filter((r) => r.status !== 'available');
            if (unavailable.length > 0) {
                throw new HTTPException(400, { message: `Resources ${unavailable.map(r => r.id).join(', ')} are not available` });
            }

            // Enforce ownership: Resources must belong to either initiator or receiver
            const invalidOwner = foundResources.find(
                (r) => r.ownerId !== initiatorId && r.ownerId !== receiverId
            );
            if (invalidOwner) {
                throw new HTTPException(400, {
                    message: `Resource ${invalidOwner.id} does not belong to trade participants`
                });
            }

            // 2. Create the trade record
            const [trade] = await tx
                .insert(trades)
                .values({
                    initiatorId,
                    receiverId,
                    status: 'PENDING',
                })
                .returning();

            // 3. Create trade items
            await tx.insert(tradeItems).values(
                resourceIds.map((rid) => ({
                    tradeId: trade.id,
                    resourceId: rid,
                }))
            );

            // Notify receiver
            WebSocketManager.send(receiverId, { type: 'TRADE_PROPOSED', tradeId: trade.id });

            // Schedule expiration (e.g. 10 seconds for demo purposes, normally 24h)
            // 24h = 86400000 ms
            // Demo = 5000 ms
            await tradeQueue.add('expire-trade', { tradeId: trade.id }, { delay: 86400000 });

            return trade;
        });
    }

    static async acceptTrade(tradeId: number, userId: number) {
        return await db.transaction(async (tx) => {
            // 1. Fetch trade
            const [trade] = await tx
                .select()
                .from(trades)
                .where(eq(trades.id, tradeId));

            if (!trade) throw new HTTPException(404, { message: 'Trade not found' });

            // Only receiver can accept
            if (trade.receiverId !== userId) {
                throw new HTTPException(403, { message: 'Only receiver can accept trade' });
            }

            if (trade.status !== 'PENDING') {
                throw new HTTPException(400, { message: 'Trade is not pending' });
            }

            // 2. Get all items in trade
            const items = await tx
                .select()
                .from(tradeItems)
                .where(eq(tradeItems.tradeId, tradeId));

            const resourceIds = items.map((i) => i.resourceId);

            // 3. Lock & Validate Resources
            // effectively "Optimistic Locking" by checking status again inside transaction
            const currentResources = await tx
                .select()
                .from(resources)
                .where(inArray(resources.id, resourceIds));

            const unavailable = currentResources.filter((r) => r.status !== 'available');
            if (unavailable.length > 0) {
                // Fail the trade if resources disappeared or were traded elsewhere
                throw new HTTPException(409, { message: 'Some resources are no longer available' });
            }

            // 4. Update Resource Status and Ownership (Bidirectional Swap)
            // Separate resources by original owner to prevent subsequent updates from overwriting
            const receiverResources = currentResources.filter(r => r.ownerId === trade.receiverId).map(r => r.id);
            const initiatorResources = currentResources.filter(r => r.ownerId === trade.initiatorId).map(r => r.id);

            // Transfer items to Initiator
            if (receiverResources.length > 0) {
                await tx
                    .update(resources)
                    .set({
                        ownerId: trade.initiatorId,
                        status: 'available',
                        updatedAt: new Date()
                    })
                    .where(inArray(resources.id, receiverResources));
            }

            // Transfer items to Receiver
            if (initiatorResources.length > 0) {
                await tx
                    .update(resources)
                    .set({
                        ownerId: trade.receiverId,
                        status: 'available',
                        updatedAt: new Date()
                    })
                    .where(inArray(resources.id, initiatorResources));
            }

            // 5. Update Trade Status
            const [updatedTrade] = await tx
                .update(trades)
                .set({ status: 'ACCEPTED', updatedAt: new Date() })
                .where(eq(trades.id, tradeId))
                .returning();

            // Notify both parties
            WebSocketManager.send(updatedTrade.initiatorId, { type: 'TRADE_ACCEPTED', tradeId: updatedTrade.id });
            WebSocketManager.send(updatedTrade.receiverId, { type: 'TRADE_ACCEPTED', tradeId: updatedTrade.id });

            // 6. Auto-reject other pending trades involving these resources
            const otherTradesResult = await tx
                .select({ id: trades.id, initiatorId: trades.initiatorId, receiverId: trades.receiverId })
                .from(trades)
                .innerJoin(tradeItems, eq(trades.id, tradeItems.tradeId))
                .where(
                    and(
                        eq(trades.status, 'PENDING'),
                        inArray(tradeItems.resourceId, resourceIds),
                        not(eq(trades.id, tradeId))
                    )
                );

            const otherTradeIds = [...new Set(otherTradesResult.map(t => t.id))].filter(id => id !== tradeId);

            if (otherTradeIds.length > 0) {
                await tx
                    .update(trades)
                    .set({ status: 'REJECTED', updatedAt: new Date() })
                    .where(inArray(trades.id, otherTradeIds));

                // Notify relevant users
                for (const tId of otherTradeIds) {
                    const t = otherTradesResult.find(x => x.id === tId);
                    if (t) {
                        WebSocketManager.send(t.initiatorId, { type: 'TRADE_REJECTED', tradeId: tId, reason: 'Resource no longer available' });
                        WebSocketManager.send(t.receiverId, { type: 'TRADE_REJECTED', tradeId: tId, reason: 'Resource no longer available' });
                    }
                }
            }

            return updatedTrade;
        });
    }

    static async cancelTrade(tradeId: number, userId: number) {
        return await db.transaction(async (tx) => {
            const [trade] = await tx.select().from(trades).where(eq(trades.id, tradeId));
            if (!trade) throw new HTTPException(404, { message: 'Trade not found' });
            if (trade.initiatorId !== userId) throw new HTTPException(403, { message: 'Only initiator can cancel' });
            if (trade.status !== 'PENDING') throw new HTTPException(400, { message: 'Trade is not pending' });

            const [updated] = await tx
                .update(trades)
                .set({ status: 'CANCELLED', updatedAt: new Date() })
                .where(eq(trades.id, tradeId))
                .returning();

            WebSocketManager.send(trade.receiverId, { type: 'TRADE_CANCELLED', tradeId });
            return updated;
        });
    }

    static async rejectTrade(tradeId: number, userId: number) {
        return await db.transaction(async (tx) => {
            const [trade] = await tx.select().from(trades).where(eq(trades.id, tradeId));
            if (!trade) throw new HTTPException(404, { message: 'Trade not found' });
            if (trade.receiverId !== userId) throw new HTTPException(403, { message: 'Only receiver can reject' });
            if (trade.status !== 'PENDING') throw new HTTPException(400, { message: 'Trade is not pending' });

            const [updated] = await tx
                .update(trades)
                .set({ status: 'REJECTED', updatedAt: new Date() })
                .where(eq(trades.id, tradeId))
                .returning();

            WebSocketManager.send(trade.initiatorId, { type: 'TRADE_REJECTED', tradeId });
            return updated;
        });
    }

    static async invalidateTradesByResourceId(resourceId: number) {
        return await db.transaction(async (tx) => {
            // Find all PENDING trades involving this resource
            const involvedTrades = await tx
                .select({ id: trades.id, initiatorId: trades.initiatorId, receiverId: trades.receiverId })
                .from(trades)
                .innerJoin(tradeItems, eq(trades.id, tradeItems.tradeId))
                .where(
                    and(
                        eq(trades.status, 'PENDING'),
                        eq(tradeItems.resourceId, resourceId)
                    )
                );

            if (involvedTrades.length === 0) return;

            const tradeIds = [...new Set(involvedTrades.map(t => t.id))];

            // Cancel these trades
            await tx
                .update(trades)
                .set({ status: 'CANCELLED', updatedAt: new Date() })
                .where(inArray(trades.id, tradeIds));

            // Notify participants
            for (const trade of involvedTrades) {
                WebSocketManager.send(trade.initiatorId, {
                    type: 'TRADE_CANCELLED',
                    tradeId: trade.id,
                    reason: 'One of the items in this trade was removed from the network'
                });
                WebSocketManager.send(trade.receiverId, {
                    type: 'TRADE_CANCELLED',
                    tradeId: trade.id,
                    reason: 'One of the items in this trade was removed from the network'
                });
            }
        });
    }

    static async getTradesForUser(userId: number) {
        return await db.select().from(trades).where(
            // or(eq(trades.initiatorId, userId), eq(trades.receiverId, userId)) // Need to import 'or'
            // For simplicity just showing initiator ones for now or receiver
            eq(trades.initiatorId, userId)
        );
    }
}
