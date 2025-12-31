import { Queue, Worker } from 'bullmq';
import { db } from '../db';
import { trades } from '../db/schema';
import { eq } from 'drizzle-orm';
import { WebSocketManager } from './ws';

// Connect to Redis
const connection = {
    host: 'localhost',
    port: 6379,
};

export const tradeQueue = new Queue('trade-expiration', { connection });

// Worker Processor
// This runs in the same process for simplicity, but in prod could be a separate microservice
export const tradeWorker = new Worker('trade-expiration', async (job) => {
    const { tradeId } = job.data;
    console.log(`Checking expiration for trade ${tradeId}`);

    // 1. Fetch trade
    const [trade] = await db
        .select()
        .from(trades)
        .where(eq(trades.id, tradeId));

    if (!trade) return;

    // 2. If still PENDING, expire it
    if (trade.status === 'PENDING') {
        const [updated] = await db
            .update(trades)
            .set({ status: 'CANCELLED', updatedAt: new Date() })
            .where(eq(trades.id, tradeId))
            .returning();

        console.log(`Trade ${tradeId} expired.`);

        // 3. Notify users
        WebSocketManager.send(updated.initiatorId, { type: 'TRADE_EXPIRED', tradeId });
        WebSocketManager.send(updated.receiverId, { type: 'TRADE_EXPIRED', tradeId });
    }
}, { connection });
