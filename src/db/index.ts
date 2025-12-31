import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://mycelium:password@localhost:5433/mycelium';

// Prevent immediate connection in tests if we want to mock it or use a different valid one
// But for unit tests where we mock the module, we shouldn't even reach here ideally.
// However, if we do, let's make sure we don't hold the process if it's 'test' env and we haven't mocked it successfully.
// Actually, let's just create the client. Drizzle uses it lazily? 
// Postgres.js creates a pool immediately.

const isTest = process.env.NODE_ENV === 'test' || process.env.BUN_TEST === '1';

// In test environment, we might want to avoid creating the default pool if we intend to replace it.
// OR we can make it valid to basic postgres and close it?

export const client = isTest
    ? postgres(connectionString, { max: 1, idle_timeout: 1, prepare: false }) // Weak pool for tests
    : postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
