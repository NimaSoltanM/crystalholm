import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  localCartAtom,
  dbCartAtom,
  activeCartAtom,
  addToLocalCartAtom,
  updateLocalCartItemAtom,
  removeFromLocalCartAtom,
  isLoggedInAtom,
  userIdAtom,
} from './atoms';
import { useCartSync } from './use-cart-sync';
import { addCartItem, updateCartItem, removeCartItem } from './actions';
import type { LocalCartItem } from '@/server/db/schema';

export function useCart() {
  const [localCart] = useAtom(localCartAtom);
  const [dbCart, setDbCart] = useAtom(dbCartAtom);
  const activeCart = useAtomValue(activeCartAtom);
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const userId = useAtomValue(userIdAtom);

  // Local cart actions
  const addToLocalCart = useSetAtom(addToLocalCartAtom);
  const updateLocalCartItem = useSetAtom(updateLocalCartItemAtom);
  const removeFromLocalCart = useSetAtom(removeFromLocalCartAtom);

  // Cart sync
  const { loadUserCart, logoutCart } = useCartSync();

  // Add item to cart (handles both local and database)
  const addItem = async (item: Omit<LocalCartItem, 'timestamp'>) => {
    if (isLoggedIn && userId) {
      // Add to database
      const result = await addCartItem({
        data: {
          userId,
          productId: item.productId,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          unitPrice: item.unitPrice,
        },
      });

      if (result.success) {
        // Refresh database cart
        const cartResult = await loadUserCart(userId);
        return cartResult;
      } else {
        return result;
      }
    } else {
      // Add to localStorage
      addToLocalCart(item);
      return { success: true };
    }
  };

  // Update item quantity
  const updateItem = async (
    productId: number,
    selectedOptions: LocalCartItem['selectedOptions'],
    quantity: number
  ) => {
    if (isLoggedIn && userId && dbCart) {
      // Find the database item
      const dbItem = dbCart.items.find(
        (item) =>
          item.productId === productId &&
          JSON.stringify(item.selectedOptions) ===
            JSON.stringify(selectedOptions)
      );

      if (dbItem) {
        const result = await updateCartItem({
          data: {
            userId,
            itemId: dbItem.id,
            quantity,
          },
        });

        if (result.success) {
          // Refresh database cart
          return await loadUserCart(userId);
        } else {
          return result;
        }
      }
    } else {
      // Update localStorage
      updateLocalCartItem({ productId, selectedOptions, quantity });
      return { success: true };
    }
  };

  // Remove item from cart
  const removeItem = async (
    productId: number,
    selectedOptions: LocalCartItem['selectedOptions']
  ) => {
    if (isLoggedIn && userId && dbCart) {
      // Find the database item
      const dbItem = dbCart.items.find(
        (item) =>
          item.productId === productId &&
          JSON.stringify(item.selectedOptions) ===
            JSON.stringify(selectedOptions)
      );

      if (dbItem) {
        const result = await removeCartItem({
          data: {
            userId,
            itemId: dbItem.id,
          },
        });

        if (result.success) {
          // Refresh database cart
          return await loadUserCart(userId);
        } else {
          return result;
        }
      }
    } else {
      // Remove from localStorage
      removeFromLocalCart({ productId, selectedOptions });
      return { success: true };
    }
  };

  return {
    // Cart state
    cart: activeCart,
    items: activeCart.items,
    totalItems: activeCart.totalItems,
    totalPrice: activeCart.totalPrice,
    isEmpty: activeCart.totalItems === 0,

    // Actions
    addItem,
    updateItem,
    removeItem,

    // Auth & sync
    loadUserCart,
    logoutCart,

    // State
    isLoggedIn,
    userId,

    // Raw data for debugging
    localCart,
    dbCart,
  };
}
