import { describe, expect, test, beforeAll, afterAll, mock } from 'bun:test';
import { setupTestDb, teardownTestDb, getTestDb } from './setup';

// Mock the DB module BEFORE importing the app
// Use Proxy to handle lazy initialization of testDb
mock.module('../src/db', () => ({
    db: new Proxy({}, {
        get: (_target, prop) => {
            const instance = getTestDb();
            if (!instance) throw new Error('DB not initialized in test');
            return (instance as any)[prop];
        }
    })
}));

// Mock the Queue (BullMQ) to avoid Redis connection
mock.module('../src/lib/queue', () => {
    return {
        tradeQueue: {
            add: () => Promise.resolve(),
        },
        tradeWorker: {}, // Mock worker
    }
});

// Import app AFTER mocks
// We can't import the full app because it runs the server listen on import?
// Let's check index.ts. It calls `app.get` but also `app.listen` or export default with fetch.
// It does `console.log("Server is running...")` but `export default` handles execution in Bun.
// However, the `rateLimiter` and `WebSocketManager` are also there.
// We should preferably import just the routes or the Hono app instance.
// But `index.ts` exports `fetch`.

import appExport from '../src/index';

describe('Auth Module Integration', () => {
    beforeAll(async () => {
        await setupTestDb();
    });

    afterAll(async () => {
        await teardownTestDb();
    });

    test('POST /auth/register - should create a new user', async () => {
        const random = Math.random().toString(36).substring(7);
        const res = await appExport.fetch(new Request('http://localhost/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                username: `alice_${random}`,
                email: `alice_${random}@example.com`,
                password: 'password123'
            }),
            headers: { 'Content-Type': 'application/json' }
        }));

        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body).toHaveProperty('userId');
        expect(res.headers.get('set-cookie')).toContain('session_id');
    });

    test('POST /auth/login - should log in existing user', async () => {
        // Create user first
        const random = Math.random().toString(36).substring(7);
        await appExport.fetch(new Request('http://localhost/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                username: `bob_${random}`,
                email: `bob_${random}@example.com`,
                password: 'password123'
            }),
            headers: { 'Content-Type': 'application/json' }
        }));

        const res = await appExport.fetch(new Request('http://localhost/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: `bob_${random}@example.com`,
                password: 'password123'
            }),
            headers: { 'Content-Type': 'application/json' }
        }));

        expect(res.status).toBe(200);
        expect(res.headers.get('set-cookie')).toContain('session_id');
    });

    test('POST /auth/login - should reject wrong password', async () => {
        const res = await appExport.fetch(new Request('http://localhost/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: 'alice_test@example.com',
                password: 'wrongpassword'
            }),
            headers: { 'Content-Type': 'application/json' }
        }));

        expect(res.status).toBe(401);
    });
});
