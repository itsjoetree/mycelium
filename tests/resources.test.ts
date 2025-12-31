import { describe, expect, test, beforeAll, afterAll, mock } from 'bun:test';
import { setupTestDb, teardownTestDb, getTestDb } from './setup';

// Mock DB and Queue
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

mock.module('../src/lib/queue', () => ({
    tradeQueue: { add: () => Promise.resolve() },
    tradeWorker: {},
}));

import appExport from '../src/index';

describe('Resource Module', () => {
    beforeAll(async () => {
        await setupTestDb();
    });

    afterAll(async () => {
        await teardownTestDb();
    });

    // Helper to get auth cookie (Quick login)
    // We assume 'auth.test.ts' might have run or we register a fresh user here.
    async function getAuthCookie(username: string) {
        const uniqueName = `${username}_${Math.random().toString(36).substring(7)}`;
        await appExport.fetch(new Request('http://localhost/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username: uniqueName, email: `${uniqueName}@test.com`, password: 'password' }),
            headers: { 'Content-Type': 'application/json' }
        }));
        const res = await appExport.fetch(new Request('http://localhost/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: `${uniqueName}@test.com`, password: 'password' }),
            headers: { 'Content-Type': 'application/json' }
        }));
        return res.headers.get('set-cookie');
    }

    test('POST /resources - should create a resource', async () => {
        const cookie = await getAuthCookie('farmer_bob');

        const res = await appExport.fetch(new Request('http://localhost/resources', {
            method: 'POST',
            body: JSON.stringify({
                title: 'Heirloom Tomatoes',
                type: 'harvest',
                quantity: 10,
                unit: 'kg',
                latitude: 40.7128,
                longitude: -74.0060
            }),
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie || ''
            }
        }));

        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.title).toBe('Heirloom Tomatoes');
        expect(body.ownerId).toBeDefined();
    });

    test('GET /resources - should list resources', async () => {
        const res = await appExport.fetch(new Request('http://localhost/resources'));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
    });
});
