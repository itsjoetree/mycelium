import { pgTable, text, serial, timestamp, integer, boolean, numeric } from 'drizzle-orm/pg-core';
import { users } from './users';

export const resources = pgTable('resources', {
    id: serial('id').primaryKey(),
    ownerId: integer('owner_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    type: text('type').notNull(), // 'seed', 'compost', 'harvest', 'labor'
    status: text('status').default('available'), // 'available', 'traded', 'pending'
    quantity: integer('quantity').default(1),
    unit: text('unit'), // 'kg', 'packet', 'hour'

    // Simple geolocation
    latitude: numeric('latitude', { precision: 10, scale: 6 }),
    longitude: numeric('longitude', { precision: 10, scale: 6 }),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
