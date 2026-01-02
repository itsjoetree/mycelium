import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    receiverId: integer('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
