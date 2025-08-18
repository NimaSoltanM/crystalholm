import { useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  localCartAtom,
  dbCartAtom,
  clearLocalCartAtom,
  isLoggedInAtom,
  userIdAtom,
} from './atoms';
import { syncLocalCart, getUserCart } from './actions';

export function useCartSync() {
  const [localCart] = useAtom(localCartAtom);
  const setDbCart = useSetAtom(dbCartAtom);
  const clearLocalCart = useSetAtom(clearLocalCartAtom);
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);
  const setUserId = useSetAtom(userIdAtom);

  // Main sync function - call this when user logs in
  const syncCart = useCallback(
    async (userId: number) => {
      try {
        // 1. Update auth state
        setIsLoggedIn(true);
        setUserId(userId);

        // 2. If there are items in localStorage, sync them
        if (localCart.length > 0) {
          const syncResult = await syncLocalCart({
            data: {
              userId,
              localCartItems: localCart,
            },
          });

          if (!syncResult.success) {
            throw new Error(syncResult.error);
          }

          // 3. Clear localStorage after successful sync
          clearLocalCart();
        }

        // 4. Load the updated database cart
        const cartResult = await getUserCart({ data: userId });
        if (cartResult.success) {
          setDbCart(cartResult.data ?? null);
        }

        return { success: true };
      } catch (error: any) {
        console.error('Cart sync failed:', error);
        return {
          success: false,
          error: error.message || 'خطا در همگام‌سازی سبد خرید',
        };
      }
    },
    [localCart, setDbCart, clearLocalCart, setIsLoggedIn, setUserId]
  );

  // Load user's cart (for when user is already logged in)
  const loadUserCart = useCallback(
    async (userId: number) => {
      try {
        setIsLoggedIn(true);
        setUserId(userId);

        const result = await getUserCart({ data: userId });
        if (result.success) {
          setDbCart(result.data ?? null);
        }

        return result;
      } catch (error: any) {
        console.error('Failed to load user cart:', error);
        return {
          success: false,
          error: error.message || 'خطا در بارگذاری سبد خرید',
        };
      }
    },
    [setDbCart, setIsLoggedIn, setUserId]
  );

  // Logout function - clear everything
  const logoutCart = useCallback(() => {
    setIsLoggedIn(false);
    setUserId(null);
    setDbCart(null);
    // Keep localStorage cart intact for anonymous browsing
  }, [setIsLoggedIn, setUserId, setDbCart]);

  // Check if sync is needed (has localStorage items when logging in)
  const needsSync = localCart.length > 0;

  return {
    syncCart,
    loadUserCart,
    logoutCart,
    needsSync,
  };
}
