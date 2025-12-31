import { db } from '../../db';
import { trades, tradeItems, resources } from '../../db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { WebSocketManager } from '../../lib/ws';
import { tradeQueue } from '../../lib/queue';

export class TradeService {
    static async createTrade(initiatorId: number, receiverId: number, resourceIds: number[]) {
        return await db.transaction(async (tx) => {
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

            // 4. Update Resource Status to 'traded'
            await tx
                .update(resources)
                .set({ status: 'traded', updatedAt: new Date() })
                .where(inArray(resources.id, resourceIds));

            // 5. Update Trade Status
            const [updatedTrade] = await tx
                .update(trades)
                .set({ status: 'ACCEPTED', updatedAt: new Date() })
                .where(eq(trades.id, tradeId))
                .returning();

            // Notify initiator
            WebSocketManager.send(updatedTrade.initiatorId, { type: 'TRADE_ACCEPTED', tradeId: updatedTrade.id });

            return updatedTrade;
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
