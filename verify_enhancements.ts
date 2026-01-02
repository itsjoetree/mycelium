import { db } from './src/db';
import { users, resources, notifications, trades } from './src/db/schema';
import { TradeService } from './src/modules/trades/service';
import { eq } from 'drizzle-orm';

async function verify() {
    console.log('--- Verifying Descriptive Notifications ---');

    // 1. Get Alice and Bob
    const alice = await db.query.users.findFirst({ where: eq(users.username, 'alice') });
    const bob = await db.query.users.findFirst({ where: eq(users.username, 'bob') });

    if (!alice || !bob) {
        console.error('Alice or Bob not found. Please run register first.');
        return;
    }

    // 2. Ensure resource for Alice
    let resource = await db.query.resources.findFirst({ where: eq(resources.ownerId, alice.id) });
    if (!resource) {
        [resource] = await db.insert(resources).values({
            ownerId: alice.id,
            title: 'Descriptive Test Item',
            quantity: 5,
            unit: 'pcs',
            type: 'SEED',
            status: 'available'
        }).returning();
    } else {
        await db.update(resources).set({ status: 'available' }).where(eq(resources.id, resource.id));
    }

    // 3. Bob proposes trade to Alice
    console.log(`Bob (@${bob.username}) proposing trade to Alice (@${alice.username})`);
    const trade = await TradeService.createTrade(bob.id, alice.id, [resource.id]);

    // 4. Verify Alice's notification
    const [lastNotif] = await db.select().from(notifications)
        .where(eq(notifications.userId, alice.id))
        .orderBy(notifications.createdAt).limit(1);

    console.log('Notification Content:', lastNotif.content);
    if (lastNotif.content.includes(`@${bob.username}`)) {
        console.log('[SUCCESS] Notification includes participant name!');
    } else {
        console.error('[FAILURE] Notification missing participant name.');
    }

    // 5. Verify GET /trades/:id (via service)
    console.log('Verifying single trade retrieval...');
    const tradeDetails = await TradeService.getTradeById(trade.id, alice.id);
    if (tradeDetails && tradeDetails.resources.length > 0) {
        console.log('[SUCCESS] Single trade retrieval works!');
        console.log('Items:', tradeDetails.resources.map(r => r.title).join(', '));
    } else {
        console.error('[FAILURE] Failed to retrieve single trade details.');
    }

    process.exit(0);
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});
