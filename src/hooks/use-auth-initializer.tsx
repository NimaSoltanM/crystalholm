import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { isLoggedInAtom, userIdAtom, dbCartAtom } from '@/features/cart/atoms';
import { getUserCart } from '@/features/cart/actions';
import { getCurrentUser } from '@/features/auth/actions';

export function useAuthInitializer() {
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);
  const setUserId = useSetAtom(userIdAtom);
  const setDbCart = useSetAtom(dbCartAtom);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check if user is logged in
        const user = await getCurrentUser();

        if (!mounted) return;

        if (user) {
          // User is logged in
          setIsLoggedIn(true);
          setUserId(user.id);

          // Load their cart
          const cartResult = await getUserCart({ data: user.id });
          if (mounted && cartResult.success) {
            setDbCart(cartResult.data ?? null);
          }
        } else {
          // User is not logged in
          setIsLoggedIn(false);
          setUserId(null);
          setDbCart(null);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          setIsLoggedIn(false);
          setUserId(null);
          setDbCart(null);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [setIsLoggedIn, setUserId, setDbCart]);
}

// Provider component to wrap your app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuthInitializer();
  return <>{children}</>;
}
