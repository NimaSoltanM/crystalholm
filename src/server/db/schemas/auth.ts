import {
  pgTable,
  serial,
  varchar,
  timestamp,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  isProfileComplete: boolean('is_profile_complete').default(false),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const verificationCodes = pgTable('verification_codes', {
  id: serial('id').primaryKey(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  code: varchar('code', { length: 5 }).notNull(),
  isUsed: boolean('is_used').default(false),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Optional: If you want to track user sessions
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type NewVerificationCode = typeof verificationCodes.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
