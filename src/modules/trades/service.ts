import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../db';
import { users, trades, tradeItems, resources } from '../../db/schema';
import { eq, inArray, and, or, desc, not } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { WebSocketManager } from '../../lib/ws';
import { tradeQueue } from '../../lib/queue';
import { NotificationService } from '../notifications/service';

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

    static async getTradeById(tradeId: number, userId: number) {
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
                and(
                    eq(trades.id, tradeId),
                    or(eq(trades.initiatorId, userId), eq(trades.receiverId, userId))
                )
            );

        if (results.length === 0) return null;

        const tradeData = {
            id: results[0].id,
            initiatorId: results[0].initiatorId,
            receiverId: results[0].receiverId,
            status: results[0].status,
            createdAt: results[0].createdAt,
            initiatorUsername: results[0].initiatorUsername,
            receiverUsername: results[0].receiverUsername,
            resources: results
                .filter(r => r.resourceTitle)
                .map(r => ({
                    title: r.resourceTitle!,
                    quantity: r.resourceQuantity!,
                    unit: r.resourceUnit!,
                    ownerId: r.resourceOwnerId!,
                    type: r.resourceType!,
                })),
        };

        return tradeData;
    }

    static async createTrade(initiatorId: number, receiverId: number, resourceIds: number[]) {
        const trade = await db.transaction(async (tx) => {
            // 0. Prevent duplicate pending trades
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

            // 1. Verify existence and availability
            const foundResources = await tx
                .select()
                .from(resources)
                .where(inArray(resources.id, resourceIds));

            if (foundResources.length !== resourceIds.length) {
                throw new HTTPException(400, { message: 'One or more resources not found' });
            }

            const unavailable = foundResources.filter((r) => r.status !== 'available');
            if (unavailable.length > 0) {
                throw new HTTPException(400, { message: `Resources ${unavailable.map(r => r.id).join(', ')} are not available` });
            }

            // Enforce ownership
            const invalidOwner = foundResources.find(
                (r) => r.ownerId !== initiatorId && r.ownerId !== receiverId
            );
            if (invalidOwner) {
                throw new HTTPException(400, { message: `Resource ${invalidOwner.id} does not belong to trade participants` });
            }

            // 2. Create trade
            const [trade] = await tx
                .insert(trades)
                .values({ initiatorId, receiverId, status: 'PENDING' })
                .returning();

            // 3. Create items
            await tx.insert(tradeItems).values(
                resourceIds.map((rid) => ({ tradeId: trade.id, resourceId: rid }))
            );

            return trade;
        });

        // 4. Notifications
        const initiator = await db.query.users.findFirst({
            where: eq(users.id, initiatorId),
            columns: { username: true }
        });

        WebSocketManager.send(receiverId, { type: 'TRADE_PROPOSED', tradeId: trade.id });
        await NotificationService.createNotification({
            userId: receiverId,
            type: 'TRADE_PROPOSED',
            content: `@${initiator?.username || 'Someone'} started a trade with you!`,
            tradeId: trade.id,
        });

        await tradeQueue.add('expire-trade', { tradeId: trade.id }, { delay: 86400000 });

        return trade;
    }

    static async acceptTrade(tradeId: number, userId: number) {
        const { updatedTrade, otherTradesResult, otherTradeIds } = await db.transaction(async (tx) => {
            const [trade] = await tx.select().from(trades).where(eq(trades.id, tradeId));
            if (!trade) throw new HTTPException(404, { message: 'Trade not found' });
            if (trade.receiverId !== userId) throw new HTTPException(403, { message: 'Only receiver can accept trade' });
            if (trade.status !== 'PENDING') throw new HTTPException(400, { message: 'Trade is not pending' });

            const items = await tx.select().from(tradeItems).where(eq(tradeItems.tradeId, tradeId));
            const resourceIds = items.map((i) => i.resourceId);
            const currentResources = await tx.select().from(resources).where(inArray(resources.id, resourceIds));

            const unavailable = currentResources.filter((r) => r.status !== 'available');
            if (unavailable.length > 0) throw new HTTPException(409, { message: 'Some resources are no longer available' });

            const receiverResources = currentResources.filter(r => r.ownerId === trade.receiverId).map(r => r.id);
            const initiatorResources = currentResources.filter(r => r.ownerId === trade.initiatorId).map(r => r.id);

            if (receiverResources.length > 0) {
                await tx.update(resources).set({ ownerId: trade.initiatorId, status: 'available', updatedAt: new Date() }).where(inArray(resources.id, receiverResources));
            }
            if (initiatorResources.length > 0) {
                await tx.update(resources).set({ ownerId: trade.receiverId, status: 'available', updatedAt: new Date() }).where(inArray(resources.id, initiatorResources));
            }

            const [updatedTrade] = await tx.update(trades).set({ status: 'ACCEPTED', updatedAt: new Date() }).where(eq(trades.id, tradeId)).returning();

            const otherTradesResult = await tx
                .select({ id: trades.id, initiatorId: trades.initiatorId, receiverId: trades.receiverId })
                .from(trades)
                .innerJoin(tradeItems, eq(trades.id, tradeItems.tradeId))
                .where(and(eq(trades.status, 'PENDING'), inArray(tradeItems.resourceId, resourceIds), not(eq(trades.id, tradeId))));

            const otherTradeIds = [...new Set(otherTradesResult.map(t => t.id))].filter(id => id !== tradeId);
            if (otherTradeIds.length > 0) {
                await tx.update(trades).set({ status: 'REJECTED', updatedAt: new Date() }).where(inArray(trades.id, otherTradeIds));
            }

            return { updatedTrade, otherTradesResult, otherTradeIds };
        });

        // Notifications
        const receiver = await db.query.users.findFirst({
            where: eq(users.id, updatedTrade.receiverId),
            columns: { username: true }
        });

        WebSocketManager.send(updatedTrade.initiatorId, { type: 'TRADE_ACCEPTED', tradeId: updatedTrade.id });
        WebSocketManager.send(updatedTrade.receiverId, { type: 'TRADE_ACCEPTED', tradeId: updatedTrade.id });

        await NotificationService.createNotification({
            userId: updatedTrade.initiatorId,
            type: 'TRADE_ACCEPTED',
            content: `@${receiver?.username || 'Someone'} accepted your trade proposal!`,
            tradeId: updatedTrade.id,
        });

        for (const tId of otherTradeIds) {
            const t = otherTradesResult.find(x => x.id === tId);
            if (t) {
                WebSocketManager.send(t.initiatorId, { type: 'TRADE_REJECTED', tradeId: tId, reason: 'Resource no longer available' });
                await NotificationService.createNotification({
                    userId: t.initiatorId,
                    type: 'TRADE_REJECTED',
                    content: `Your trade proposal for some items was closed because they were traded to @${receiver?.username || 'someone else'}.`,
                    tradeId: tId,
                });
            }
        }

        return updatedTrade;
    }

    static async cancelTrade(tradeId: number, userId: number) {
        const trade = await db.transaction(async (tx) => {
            const [trade] = await tx.select().from(trades).where(eq(trades.id, tradeId));
            if (!trade) throw new HTTPException(404, { message: 'Trade not found' });
            if (trade.initiatorId !== userId) throw new HTTPException(403, { message: 'Only initiator can cancel' });
            if (trade.status !== 'PENDING') throw new HTTPException(400, { message: 'Trade is not pending' });

            const [updated] = await tx.update(trades).set({ status: 'CANCELLED', updatedAt: new Date() }).where(eq(trades.id, tradeId)).returning();
            return updated;
        });

        WebSocketManager.send(trade.receiverId, { type: 'TRADE_CANCELLED', tradeId: trade.id });
        return trade;
    }

    static async rejectTrade(tradeId: number, userId: number) {
        const trade = await db.transaction(async (tx) => {
            const [trade] = await tx.select().from(trades).where(eq(trades.id, tradeId));
            if (!trade) throw new HTTPException(404, { message: 'Trade not found' });
            if (trade.receiverId !== userId) throw new HTTPException(403, { message: 'Only receiver can reject' });
            if (trade.status !== 'PENDING') throw new HTTPException(400, { message: 'Trade is not pending' });

            const [updated] = await tx.update(trades).set({ status: 'REJECTED', updatedAt: new Date() }).where(eq(trades.id, tradeId)).returning();
            return updated;
        });

        const receiver = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { username: true }
        });

        WebSocketManager.send(trade.initiatorId, { type: 'TRADE_REJECTED', tradeId: trade.id });
        await NotificationService.createNotification({
            userId: trade.initiatorId,
            type: 'TRADE_REJECTED',
            content: `@${receiver?.username || 'Someone'} declined your trade proposal.`,
            tradeId: trade.id,
        });

        return trade;
    }

    static async invalidateTradesByResourceId(resourceId: number) {
        const involvedTrades = await db
            .select({ id: trades.id, initiatorId: trades.initiatorId, receiverId: trades.receiverId })
            .from(trades)
            .innerJoin(tradeItems, eq(trades.id, tradeItems.tradeId))
            .where(and(eq(trades.status, 'PENDING'), eq(tradeItems.resourceId, resourceId)));

        if (involvedTrades.length === 0) return;
        const tradeIds = [...new Set(involvedTrades.map(t => t.id))];

        await db.update(trades).set({ status: 'REJECTED', updatedAt: new Date() }).where(inArray(trades.id, tradeIds));

        for (const trade of involvedTrades) {
            WebSocketManager.send(trade.initiatorId, { type: 'TRADE_REJECTED', tradeId: trade.id, reason: 'Item removed from network' });
            WebSocketManager.send(trade.receiverId, { type: 'TRADE_REJECTED', tradeId: trade.id, reason: 'Item removed from network' });

            await NotificationService.createNotification({
                userId: trade.initiatorId,
                type: 'TRADE_REJECTED',
                content: `Your trade proposal was closed because an item was removed from the network.`,
                tradeId: trade.id,
            });
        }
    }
}
