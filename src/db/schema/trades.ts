import { pgTable, serial, integer, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { resources } from './resources';

export const trades = pgTable('trades', {
    id: serial('id').primaryKey(),
    initiatorId: integer('initiator_id')
        .notNull()
        .references(() => users.id),
    receiverId: integer('receiver_id')
        .notNull()
        .references(() => users.id),
    status: text('status', { enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'] })
        .default('PENDING')
        .notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const tradeItems = pgTable('trade_items', {
    id: serial('id').primaryKey(),
    tradeId: integer('trade_id')
        .notNull()
        .references(() => trades.id, { onDelete: 'cascade' }),
    resourceId: integer('resource_id')
        .notNull()
        .references(() => resources.id),
    // Start with simple full-item trades. Partial quantity trades would add more complexity.
});

export type Trade = typeof trades.$inferSelect;
export type NewTrade = typeof trades.$inferInsert;
export type TradeItem = typeof tradeItems.$inferSelect;
export type NewTradeItem = typeof tradeItems.$inferInsert;
