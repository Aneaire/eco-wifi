import { sqliteTable, text, integer, integer as boolean } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  macAddress: text('mac_address').unique().notNull(),
  sessionStart: text('session_start'),
  sessionEnd: text('session_end'),
  bottlesDeposited: integer('bottles_deposited').default(0),
});

export const bottles = sqliteTable('bottles', {
  id: integer('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  materialConfirmed: integer('material_confirmed', { mode: 'boolean' }).default(false),
  macAddress: text('mac_address').notNull(),
});

export const stats = sqliteTable('stats', {
  id: integer('id').primaryKey(),
  date: text('date').unique().notNull(),
  totalBottles: integer('total_bottles').default(0),
  totalSessions: integer('total_sessions').default(0),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Bottle = typeof bottles.$inferSelect;
export type NewBottle = typeof bottles.$inferInsert;
export type Stats = typeof stats.$inferSelect;
export type NewStats = typeof stats.$inferInsert;