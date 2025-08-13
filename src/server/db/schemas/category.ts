import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { products } from './product';

export const parentCategories = pgTable('parent_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subcategories = pgTable('subcategories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  parentCategoryId: integer('parent_category_id')
    .notNull()
    .references(() => parentCategories.id, { onDelete: 'cascade' }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const parentCategoriesRelations = relations(
  parentCategories,
  ({ many }) => ({
    subcategories: many(subcategories),
  })
);

export const subcategoriesRelations = relations(
  subcategories,
  ({ one, many }) => ({
    parentCategory: one(parentCategories, {
      fields: [subcategories.parentCategoryId],
      references: [parentCategories.id],
    }),
    products: many(products),
  })
);

// Export types for TypeScript
export type ParentCategory = typeof parentCategories.$inferSelect;
export type NewParentCategory = typeof parentCategories.$inferInsert;

export type Subcategory = typeof subcategories.$inferSelect;
export type NewSubcategory = typeof subcategories.$inferInsert;
