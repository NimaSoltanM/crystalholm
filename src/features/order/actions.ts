import { createServerFn } from '@tanstack/react-start';
import { orders, orderItems } from '@/server/db/schema';
import { cartItems, carts } from '@/server/db/schema';
import { products, options, optionGroups } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import db from '@/server/db';

export const createOrder = createServerFn({
  method: 'POST',
})
  .validator(
    (data: {
      userId: number;
      shippingAddress: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        province: string;
        city: string;
        address: string;
        postalCode: string;
      };
      notes?: string;
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      // Get user's cart with items
      const userCart = await db
        .select()
        .from(carts)
        .leftJoin(cartItems, eq(carts.id, cartItems.cartId))
        .leftJoin(products, eq(cartItems.productId, products.id))
        .where(eq(carts.userId, data.userId));

      if (userCart.length === 0 || !userCart[0].cart_items) {
        throw new Error('سبد خرید خالی است');
      }

      const totalAmount = userCart.reduce(
        (sum, item) =>
          sum +
          (item.cart_items?.quantity || 0) * (item.cart_items?.unitPrice || 0),
        0
      );

      // Create order
      const [newOrder] = await db
        .insert(orders)
        .values({
          userId: data.userId,
          totalAmount,
          shippingAddress: data.shippingAddress,
          notes: data.notes,
        })
        .returning();

      // Create order items with enhanced options data
      const orderItemsPromises = userCart
        .filter((item) => item.cart_items)
        .map(async (item) => {
          let enhancedOptions:
            | {
                optionGroupId: number;
                optionGroupName: string;
                optionId: number;
                optionName: string;
              }[]
            | null = null;

          if (item.cart_items!.selectedOptions) {
            const optionDetails = await Promise.all(
              item.cart_items!.selectedOptions.map(async (opt) => {
                const optionData = await db
                  .select({
                    optionGroupName: optionGroups.name,
                    optionName: options.name,
                  })
                  .from(options)
                  .leftJoin(
                    optionGroups,
                    eq(options.optionGroupId, optionGroups.id)
                  )
                  .where(eq(options.id, opt.optionId))
                  .limit(1);

                return {
                  optionGroupId: opt.optionGroupId,
                  optionGroupName: optionData[0]?.optionGroupName || '',
                  optionId: opt.optionId,
                  optionName: optionData[0]?.optionName || '',
                };
              })
            );
            enhancedOptions = optionDetails;
          }

          return {
            orderId: newOrder.id,
            productId: item.cart_items!.productId,
            productName: item.products!.name,
            quantity: item.cart_items!.quantity,
            unitPrice: item.cart_items!.unitPrice,
            selectedOptions: enhancedOptions,
          };
        });

      const orderItemsData = await Promise.all(orderItemsPromises);

      for (const item of orderItemsData) {
        await db.insert(orderItems).values(item);
      }

      // Clear cart
      await db
        .delete(cartItems)
        .where(eq(cartItems.cartId, userCart[0].carts.id));

      return { success: true, data: newOrder };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در ثبت سفارش',
      };
    }
  });

export const getUserOrders = createServerFn({
  method: 'GET',
})
  .validator((userId: number) => userId)
  .handler(async ({ data: userId }) => {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  });

export const getOrderById = createServerFn({
  method: 'GET',
})
  .validator((orderId: number) => orderId)
  .handler(async ({ data: orderId }) => {
    const orderData = await db
      .select()
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(eq(orders.id, orderId));

    if (orderData.length === 0) {
      return null;
    }

    const order = orderData[0].orders;
    const items = orderData
      .filter((row) => row.order_items)
      .map((row) => row.order_items!);

    return { ...order, items };
  });

export const updateOrderStatus = createServerFn({
  method: 'POST',
})
  .validator((data: { orderId: number; status: string }) => data)
  .handler(async ({ data }) => {
    try {
      const [updated] = await db
        .update(orders)
        .set({
          status: data.status,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, data.orderId))
        .returning();

      if (!updated) {
        throw new Error('سفارش یافت نشد');
      }

      return { success: true, data: updated };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در به‌روزرسانی وضعیت سفارش',
      };
    }
  });
