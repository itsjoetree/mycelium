import { describe, expect, test, beforeAll, afterAll, mock } from 'bun:test';
import { setupTestDb, teardownTestDb, getTestDb } from './setup';

// Mock DB and Queue
mock.module('../src/db', () => ({
    db: new Proxy({}, {
        get: (_target, prop) => {
            const instance = getTestDb();
            if (!instance) throw new Error('DB not initialized in test');
            return (instance as any)[prop];
        }
    })
}));

mock.module('../src/lib/queue', () => ({
    tradeQueue: { add: () => Promise.resolve() },
    tradeWorker: {},
}));

import appExport from '../src/index';

describe('Trade Module', () => {
    beforeAll(async () => {
        await setupTestDb();
    });

    afterAll(async () => {
        await teardownTestDb();
    });

    async function registerUser(name: string) {
        const uniqueName = `${name}_${Math.random().toString(36).substring(7)}`;
        const res = await appExport.fetch(new Request('http://localhost/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username: uniqueName, email: `${uniqueName}@trade.com`, password: 'password' }),
            headers: { 'Content-Type': 'application/json' }
        }));
        const cookie = res.headers.get('set-cookie');
        const data = await res.json();
        return { id: data.userId, cookie };
    }

    async function createResource(cookie: string) {
        const res = await appExport.fetch(new Request('http://localhost/resources', {
            method: 'POST',
            body: JSON.stringify({ title: 'Trade Item', type: 'seed', quantity: 1, unit: 'packet' }),
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie || '' }
        }));
        return await res.json();
    }

    test('Trade Flow: Propose -> Accept', async () => {
        // 1. Setup Users
        const userA = await registerUser('trader_a');
        const userB = await registerUser('trader_b');

        // 2. User A has a resource
        const resource = await createResource(userA.cookie!);

        // 3. User B proposes trade (should fail - User B doesn't own it, and User A isn't receiver)
        // Wait, logic is: Resources in trade must be owned by Initiator OR Receiver.
        // User B (Initiator) proposes trade to User A (Receiver) using User A's resource.
        // Owner (A) == Receiver (A). Valid!

        const proposeRes = await appExport.fetch(new Request('http://localhost/trades', {
            method: 'POST',
            body: JSON.stringify({
                receiverId: userA.id,
                resourceIds: [resource.id]
            }),
            headers: { 'Content-Type': 'application/json', 'Cookie': userB.cookie! }
        }));

        expect(proposeRes.status).toBe(201);
        const trade = await proposeRes.json();
        expect(trade.status).toBe('PENDING');

        // 4. User A (Receiver) accepts trade
        const acceptRes = await appExport.fetch(new Request(`http://localhost/trades/${trade.id}/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': userA.cookie! }
        }));

        expect(acceptRes.status).toBe(200);
        const acceptedTrade = await acceptRes.json();
        expect(acceptedTrade.status).toBe('ACCEPTED');
    });

    test('Trade Flow: Strict Ownership Fail', async () => {
        const thief = await registerUser('thief');
        const victim = await registerUser('victim');
        const bystander = await registerUser('bystander');

        const gold = await createResource(bystander.cookie!);

        const res = await appExport.fetch(new Request('http://localhost/trades', {
            method: 'POST',
            body: JSON.stringify({
                receiverId: victim.id,
                resourceIds: [gold.id]
            }),
            headers: { 'Content-Type': 'application/json', 'Cookie': thief.cookie! }
        }));

        expect(res.status).toBe(400); // Should be rejected
    });
});
