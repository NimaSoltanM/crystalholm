import {
  pgTable,
  serial,
  integer,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { products } from './product';

// Main cart table - one per user
export const carts = pgTable('carts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Cart items - products with their selected options
export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  cartId: integer('cart_id')
    .notNull()
    .references(() => carts.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  // Store selected options as JSON: [{ optionGroupId: 1, optionId: 3 }, ...]
  selectedOptions: jsonb('selected_options').$type<
    {
      optionGroupId: number;
      optionId: number;
    }[]
  >(),
  // Cache calculated price to avoid recalculation
  unitPrice: integer('unit_price').notNull(), // in cents
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

// Types
export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;

export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;

// Extended types for frontend use
export type CartItemWithProduct = CartItem & {
  product: {
    id: number;
    name: string;
    slug: string;
    imageUrl: string | null;
    basePrice: number;
  };
};

export type CartWithItems = Cart & {
  items: CartItemWithProduct[];
};

// localStorage cart item type (before user login)
export type LocalCartItem = {
  productId: number;
  quantity: number;
  selectedOptions: {
    optionGroupId: number;
    optionId: number;
  }[];
  unitPrice: number; // calculated price
  timestamp: string; // for cleanup/expiry
};
