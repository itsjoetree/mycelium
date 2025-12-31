import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import { beforeAll, afterAll, beforeEach } from 'bun:test';

// Use a separate test database
// Ensure true uniqueness per worker/thread
const TEST_DB_NAME = `mycelium_test_${Math.random().toString(36).substring(7)}`;
const BASE_CONNECTION_STRING = process.env.DATABASE_URL || 'postgres://mycelium:password@localhost:5433/postgres'; // Connect to default postgres DB to create/drop
const TEST_CONNECTION_STRING = BASE_CONNECTION_STRING.replace('/postgres', `/${TEST_DB_NAME}`);

export let testDb: ReturnType<typeof drizzle>;
let sql: postgres.Sql;

// Helper to use in mocks
export function getTestDb() {
    return testDb;
}

export async function setupTestDb() {
    console.log('Setup: Connecting to admin DB...');
    // 1. Drop and Create DB
    const adminSql = postgres(BASE_CONNECTION_STRING, { max: 1 });
    console.log('Setup: Dropping DB if exists...');
    await adminSql`DROP DATABASE IF EXISTS ${adminSql(TEST_DB_NAME)}`;
    console.log('Setup: Creating DB...');
    await adminSql`CREATE DATABASE ${adminSql(TEST_DB_NAME)}`;
    console.log('Setup: Closing admin connection...');
    await adminSql.end({ timeout: 5 });
    console.log('Setup: Admin connection closed.');

    // 2. Connect to Test DB
    console.log('Setup: Connecting to Test DB...');
    sql = postgres(TEST_CONNECTION_STRING);
    testDb = drizzle(sql, { schema });

    // 3. Run Migrations
    console.log('Running migrations...');
    await migrate(testDb, { migrationsFolder: 'drizzle' });
    console.log('Migrations complete.');
}

export async function teardownTestDb() {
    console.log('Tearing down DB...');
    await sql.end({ timeout: 5 });
    console.log('DB Teardown complete.');
}
