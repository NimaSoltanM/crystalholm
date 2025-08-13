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
import { subcategories } from './category';

// Base products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  sku: varchar('sku', { length: 50 }).unique(),
  basePrice: integer('base_price').notNull(), // base price in cents
  subcategoryId: integer('subcategory_id')
    .notNull()
    .references(() => subcategories.id, { onDelete: 'cascade' }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Option groups (e.g., "Size", "Color", "RAM", "Resolution")
export const optionGroups = pgTable('option_groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(), // "Size", "Color", etc.
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  isRequired: boolean('is_required').default(false).notNull(), // must user select this?
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Individual options within groups (e.g., "Small", "Red", "16GB", "4K")
export const options = pgTable('options', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(), // "Small", "Red", "16GB", etc.
  optionGroupId: integer('option_group_id')
    .notNull()
    .references(() => optionGroups.id, { onDelete: 'cascade' }),
  priceModifier: integer('price_modifier').default(0).notNull(), // price change in cents (can be negative)
  isDefault: boolean('is_default').default(false).notNull(), // is this the default option?
  isAvailable: boolean('is_available').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  subcategory: one(subcategories, {
    fields: [products.subcategoryId],
    references: [subcategories.id],
  }),
  optionGroups: many(optionGroups),
}));

export const optionGroupsRelations = relations(
  optionGroups,
  ({ one, many }) => ({
    product: one(products, {
      fields: [optionGroups.productId],
      references: [products.id],
    }),
    options: many(options),
  })
);

export const optionsRelations = relations(options, ({ one }) => ({
  optionGroup: one(optionGroups, {
    fields: [options.optionGroupId],
    references: [optionGroups.id],
  }),
}));

// Types
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type OptionGroup = typeof optionGroups.$inferSelect;
export type NewOptionGroup = typeof optionGroups.$inferInsert;

export type Option = typeof options.$inferSelect;
export type NewOption = typeof options.$inferInsert;
