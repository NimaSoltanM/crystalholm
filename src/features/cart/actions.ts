import { createServerFn } from '@tanstack/react-start';
import { eq, and } from 'drizzle-orm';
import db from '@/server/db';
import { carts, cartItems, products } from '@/server/db/schema';
import type { LocalCartItem } from '@/server/db/schema';

// GET: Get user's cart with all items
export const getUserCart = createServerFn({
  method: 'GET',
})
  .validator((userId: number) => userId)
  .handler(async ({ data: userId }) => {
    try {
      const userCart = await db
        .select()
        .from(carts)
        .where(eq(carts.userId, userId))
        .limit(1);

      if (userCart.length === 0) {
        return { success: true, data: null };
      }

      const cartWithItems = await db
        .select({
          cartId: cartItems.cartId,
          itemId: cartItems.id,
          productId: cartItems.productId,
          quantity: cartItems.quantity,
          selectedOptions: cartItems.selectedOptions,
          unitPrice: cartItems.unitPrice,
          itemCreatedAt: cartItems.createdAt,
          itemUpdatedAt: cartItems.updatedAt,
          productName: products.name,
          productSlug: products.slug,
          productImage: products.imageUrl,
          productBasePrice: products.basePrice,
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.cartId, userCart[0].id));

      const result = {
        id: userCart[0].id,
        userId: userCart[0].userId,
        createdAt: userCart[0].createdAt,
        updatedAt: userCart[0].updatedAt,
        items: cartWithItems.map((item) => ({
          id: item.itemId,
          cartId: item.cartId,
          productId: item.productId,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          unitPrice: item.unitPrice,
          createdAt: item.itemCreatedAt,
          updatedAt: item.itemUpdatedAt,
          product: {
            id: item.productId,
            name: item.productName,
            slug: item.productSlug,
            imageUrl: item.productImage,
            basePrice: item.productBasePrice,
          },
        })),
      };

      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در دریافت سبد خرید',
      };
    }
  });

// POST: Create cart for user
export const createUserCart = createServerFn({
  method: 'POST',
})
  .validator((userId: number) => userId)
  .handler(async ({ data: userId }) => {
    try {
      // Check if cart already exists
      const existing = await db
        .select()
        .from(carts)
        .where(eq(carts.userId, userId))
        .limit(1);

      if (existing.length > 0) {
        return { success: true, data: existing[0] };
      }

      const [newCart] = await db.insert(carts).values({ userId }).returning();

      return { success: true, data: newCart };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در ایجاد سبد خرید',
      };
    }
  });

// POST: Add item to cart
export const addCartItem = createServerFn({
  method: 'POST',
})
  .validator(
    (data: {
      userId: number;
      productId: number;
      quantity: number;
      selectedOptions: { optionGroupId: number; optionId: number }[];
      unitPrice: number;
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      // Get or create user's cart
      let userCart = await db
        .select()
        .from(carts)
        .where(eq(carts.userId, data.userId))
        .limit(1);

      if (userCart.length === 0) {
        const [newCart] = await db
          .insert(carts)
          .values({ userId: data.userId })
          .returning();
        userCart = [newCart];
      }

      // Check if item with same product and options already exists
      const existingItem = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, userCart[0].id),
            eq(cartItems.productId, data.productId)
          )
        );

      const sameOptionsItem = existingItem.find(
        (item) =>
          JSON.stringify(item.selectedOptions) ===
          JSON.stringify(data.selectedOptions)
      );

      if (sameOptionsItem) {
        // Update quantity
        const [updated] = await db
          .update(cartItems)
          .set({
            quantity: sameOptionsItem.quantity + data.quantity,
            updatedAt: new Date(),
          })
          .where(eq(cartItems.id, sameOptionsItem.id))
          .returning();

        return { success: true, data: updated };
      } else {
        // Add new item
        const [newItem] = await db
          .insert(cartItems)
          .values({
            cartId: userCart[0].id,
            productId: data.productId,
            quantity: data.quantity,
            selectedOptions: data.selectedOptions,
            unitPrice: data.unitPrice,
          })
          .returning();

        return { success: true, data: newItem };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در افزودن محصول به سبد خرید',
      };
    }
  });

// POST: Update cart item quantity
export const updateCartItem = createServerFn({
  method: 'POST',
})
  .validator(
    (data: { userId: number; itemId: number; quantity: number }) => data
  )
  .handler(async ({ data }) => {
    try {
      // Verify the item belongs to the user
      const item = await db
        .select({
          id: cartItems.id,
          cartId: cartItems.cartId,
          userId: carts.userId,
        })
        .from(cartItems)
        .innerJoin(carts, eq(cartItems.cartId, carts.id))
        .where(
          and(eq(cartItems.id, data.itemId), eq(carts.userId, data.userId))
        )
        .limit(1);

      if (item.length === 0) {
        throw new Error('محصول در سبد خرید یافت نشد');
      }

      if (data.quantity <= 0) {
        // Remove item if quantity is 0 or less
        await db.delete(cartItems).where(eq(cartItems.id, data.itemId));

        return { success: true, data: { deleted: true } };
      } else {
        // Update quantity
        const [updated] = await db
          .update(cartItems)
          .set({
            quantity: data.quantity,
            updatedAt: new Date(),
          })
          .where(eq(cartItems.id, data.itemId))
          .returning();

        return { success: true, data: updated };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در به‌روزرسانی سبد خرید',
      };
    }
  });

// POST: Remove item from cart
export const removeCartItem = createServerFn({
  method: 'POST',
})
  .validator((data: { userId: number; itemId: number }) => data)
  .handler(async ({ data }) => {
    try {
      // Verify the item belongs to the user
      const item = await db
        .select()
        .from(cartItems)
        .innerJoin(carts, eq(cartItems.cartId, carts.id))
        .where(
          and(eq(cartItems.id, data.itemId), eq(carts.userId, data.userId))
        )
        .limit(1);

      if (item.length === 0) {
        throw new Error('محصول در سبد خرید یافت نشد');
      }

      await db.delete(cartItems).where(eq(cartItems.id, data.itemId));

      return { success: true, data: { deleted: true } };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در حذف محصول از سبد خرید',
      };
    }
  });

// POST: Clear entire cart
export const clearUserCart = createServerFn({
  method: 'POST',
})
  .validator((userId: number) => userId)
  .handler(async ({ data: userId }) => {
    try {
      const userCart = await db
        .select()
        .from(carts)
        .where(eq(carts.userId, userId))
        .limit(1);

      if (userCart.length === 0) {
        return { success: true, data: { cleared: true } };
      }

      await db.delete(cartItems).where(eq(cartItems.cartId, userCart[0].id));

      return { success: true, data: { cleared: true } };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در پاک کردن سبد خرید',
      };
    }
  });

// POST: Sync local cart with database (merge operation)
export const syncLocalCart = createServerFn({
  method: 'POST',
})
  .validator(
    (data: { userId: number; localCartItems: LocalCartItem[] }) => data
  )
  .handler(async ({ data }) => {
    try {
      // Get or create user's cart
      let userCart = await db
        .select()
        .from(carts)
        .where(eq(carts.userId, data.userId))
        .limit(1);

      if (userCart.length === 0) {
        const [newCart] = await db
          .insert(carts)
          .values({ userId: data.userId })
          .returning();
        userCart = [newCart];
      }

      // Get existing cart items
      const existingItems = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, userCart[0].id));

      // Process each local cart item
      for (const localItem of data.localCartItems) {
        const existingItem = existingItems.find(
          (item) =>
            item.productId === localItem.productId &&
            JSON.stringify(item.selectedOptions) ===
              JSON.stringify(localItem.selectedOptions)
        );

        if (existingItem) {
          // Merge quantities
          await db
            .update(cartItems)
            .set({
              quantity: existingItem.quantity + localItem.quantity,
              updatedAt: new Date(),
            })
            .where(eq(cartItems.id, existingItem.id));
        } else {
          // Add new item
          await db.insert(cartItems).values({
            cartId: userCart[0].id,
            productId: localItem.productId,
            quantity: localItem.quantity,
            selectedOptions: localItem.selectedOptions,
            unitPrice: localItem.unitPrice,
          });
        }
      }

      return { success: true, data: { synced: true } };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در همگام‌سازی سبد خرید',
      };
    }
  });
