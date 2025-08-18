import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { LocalCartItem, CartWithItems } from '@/server/db/schema';
import { isSameCartItem } from './utils';

// localStorage cart for anonymous users
export const localCartAtom = atomWithStorage<LocalCartItem[]>('cart', []);

// Database cart for logged-in users
export const dbCartAtom = atom<CartWithItems | null>(null);

// Computed: current active cart (local or db)
export const activeCartAtom = atom((get) => {
  const dbCart = get(dbCartAtom);
  const localCart = get(localCartAtom);

  // If user is logged in and has db cart, use that
  if (dbCart) {
    return {
      items: dbCart.items,
      totalItems: dbCart.items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: dbCart.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      ),
    };
  }

  // Otherwise use local cart
  return {
    items: localCart,
    totalItems: localCart.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: localCart.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    ),
  };
});

// Helper atoms for cart operations
export const addToLocalCartAtom = atom(
  null,
  (get, set, newItem: Omit<LocalCartItem, 'timestamp'>) => {
    const currentCart = get(localCartAtom);
    const timestamp = new Date().toISOString();

    // Check if item with same product and options already exists
    const existingItemIndex = currentCart.findIndex((item) =>
      isSameCartItem(item, newItem)
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedCart = [...currentCart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + newItem.quantity,
        timestamp,
      };
      set(localCartAtom, updatedCart);
    } else {
      // Add new item
      set(localCartAtom, [...currentCart, { ...newItem, timestamp }]);
    }
  }
);

export const updateLocalCartItemAtom = atom(
  null,
  (
    get,
    set,
    update: {
      productId: number;
      selectedOptions: LocalCartItem['selectedOptions'];
      quantity: number;
    }
  ) => {
    const currentCart = get(localCartAtom);
    const updatedCart = currentCart.map((item) =>
      isSameCartItem(item, update)
        ? {
            ...item,
            quantity: update.quantity,
            timestamp: new Date().toISOString(),
          }
        : item
    );
    set(localCartAtom, updatedCart);
  }
);

export const removeFromLocalCartAtom = atom(
  null,
  (
    get,
    set,
    {
      productId,
      selectedOptions,
    }: { productId: number; selectedOptions: LocalCartItem['selectedOptions'] }
  ) => {
    const currentCart = get(localCartAtom);
    const updatedCart = currentCart.filter(
      (item) => !isSameCartItem(item, { productId, selectedOptions })
    );
    set(localCartAtom, updatedCart);
  }
);

export const clearLocalCartAtom = atom(null, (get, set) => {
  set(localCartAtom, []);
});

// User authentication state
export const isLoggedInAtom = atom<boolean>(false);
export const userIdAtom = atom<number | null>(null);
