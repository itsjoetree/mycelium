import { pgTable, serial, integer, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

export const friendships = pgTable('friendships', {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    friendId: integer('friend_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status', { enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED'] })
        .default('PENDING')
        .notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        // Ensure we don't have duplicate friendship records for the same pair
        // In a real system, we might want to handle bidirectional friendships with a single row
        // or ensure order (userId < friendId)
        uniquePair: uniqueIndex('unique_friendship_pair').on(table.userId, table.friendId),
    };
});

export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;
