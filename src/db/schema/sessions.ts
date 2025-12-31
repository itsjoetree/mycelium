import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const sessions = pgTable('sessions', {
    id: text('id').primaryKey(), // We'll use a strong random string
    userId: integer('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at').notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
