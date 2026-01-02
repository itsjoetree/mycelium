import { pgTable, serial, integer, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { trades } from './trades';
import { resources } from './resources';

export const notifications = pgTable('notifications', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    type: text('type').notNull(), // 'TRADE_PROPOSED', 'TRADE_ACCEPTED', 'TRADE_REJECTED', 'TRADE_CANCELLED'
    content: text('content').notNull(),
    tradeId: integer('trade_id').references(() => trades.id, { onDelete: 'set null' }),
    resourceId: integer('resource_id').references(() => resources.id, { onDelete: 'set null' }),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
