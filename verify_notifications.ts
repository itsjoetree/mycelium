import { db } from './src/db';
import { users, resources, notifications } from './src/db/schema';
import { TradeService } from './src/modules/trades/service';
import { eq } from 'drizzle-orm';

async function verify() {
    console.log('--- Verifying Notification Creation ---');

    // 1. Get Alice and Bob
    const alice = await db.query.users.findFirst({ where: eq(users.username, 'alice') });
    const bob = await db.query.users.findFirst({ where: eq(users.username, 'bob') });

    if (!alice || !bob) {
        console.error('Alice or Bob not found. Please run register first.');
        return;
    }

    // 2. Create or Reset a resource for Alice
    let resource = await db.query.resources.findFirst({ where: eq(resources.ownerId, alice.id) });
    if (!resource) {
        [resource] = await db.insert(resources).values({
            ownerId: alice.id,
            title: 'Test Resource',
            quantity: 10,
            unit: 'kg',
            type: 'FOOD',
            status: 'available'
        }).returning();
        console.log(`Created resource ${resource.id} for Alice`);
    } else {
        // Ensure it's available
        await db.update(resources).set({ status: 'available' }).where(eq(resources.id, resource.id));
        console.log(`Reset resource ${resource.id} status to available`);
    }

    // 3. Propose trade from Bob to Alice
    console.log(`Proposing trade from Bob (ID: ${bob.id}) to Alice (ID: ${alice.id}) for resource ${resource.id}`);
    const trade = await TradeService.createTrade(bob.id, alice.id, [resource.id]);
    console.log(`Trade proposed! ID: ${trade.id}`);

    // 4. Check if notification exists for Alice
    const aliceNotifs = await db.select().from(notifications).where(eq(notifications.userId, alice.id));
    console.log('Alice notifications count:', aliceNotifs.length);

    const tradeNotif = aliceNotifs.find(n => n.tradeId === trade.id);
    if (tradeNotif) {
        console.log('[SUCCESS] Notification created for Alice!');
        console.log('Content:', tradeNotif.content);
        console.log('Type:', tradeNotif.type);
    } else {
        console.error('[FAILURE] No notification found for Alice for this trade.');
    }

    process.exit(0);
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});
