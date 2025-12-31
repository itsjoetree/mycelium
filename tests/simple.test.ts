import { describe, test, expect, mock } from 'bun:test';
import { getTestDb } from './setup';

mock.module('../src/db', () => ({ db: getTestDb() }));
mock.module('../src/lib/queue', () => ({
    tradeQueue: { add: () => Promise.resolve() },
    tradeWorker: {},
}));

// Just import the app and assert something trivial
import appExport from '../src/index';

describe('Simple Test', () => {
    test('App exports fetch', () => {
        expect(appExport.fetch).toBeDefined();
    });
});
