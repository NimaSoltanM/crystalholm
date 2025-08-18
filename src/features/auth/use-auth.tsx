import { useCallback, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { isLoggedInAtom, userIdAtom, dbCartAtom } from '@/lib/atoms/cart';
import { useCartSync } from '@/hooks/useCartSync';
import {
  getCurrentUser,
  verifyCode as verifyCodeAction,
  logout as logoutAction,
  sendVerificationCode as sendCodeAction,
  completeProfile as completeProfileAction,
} from '@/features/auth/actions';
import { getUserCart } from '../cart/actions';

interface User {
  id: number;
  phoneNumber: string;
  firstName: string | null;
  lastName: string | null;
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useAtom(isLoggedInAtom);
  const [userId, setUserId] = useAtom(userIdAtom);
  const setDbCart = useSetAtom(dbCartAtom);
  const { syncCart, logoutCart } = useCartSync();
  const router = useRouter();

  // Initialize auth state on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setIsLoggedIn(true);
        setUserId(user.id);
        // Load user's cart without syncing (they're already logged in)
        const cartResult = await getUserCart({ data: user.id });
        if (cartResult.success) {
          setDbCart(cartResult.data ?? null);
        }
      } else {
        setIsLoggedIn(false);
        setUserId(null);
        setDbCart(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
      setUserId(null);
      setDbCart(null);
    }
  }, [setIsLoggedIn, setUserId, setDbCart]);

  const sendVerificationCode = useCallback(async (phoneNumber: string) => {
    try {
      const result = await sendCodeAction({ data: { phoneNumber } });
      if (result.success) {
        toast.success('کد تایید ارسال شد');
        return { success: true };
      }
    } catch (error: any) {
      toast.error(error.message || 'خطا در ارسال کد تایید');
      return { success: false, error: error.message };
    }
  }, []);

  const verifyCode = useCallback(
    async (phoneNumber: string, code: string) => {
      try {
        const result = await verifyCodeAction({
          data: { phoneNumber, code },
        });

        if (result.success) {
          // Get the current user after successful verification
          const user = await getCurrentUser();

          if (user) {
            // Sync cart when user logs in (this merges localStorage with database)
            const syncResult = await syncCart(user.id);

            if (syncResult.success) {
              toast.success('با موفقیت وارد شدید');

              // Handle redirect based on profile completion
              if (result.needsProfile) {
                router.navigate({ to: '/complete-profile' });
              } else if (result.redirectTo) {
                router.navigate({ to: result.redirectTo });
              } else {
                router.navigate({ to: '/' });
              }

              return { success: true, needsProfile: result.needsProfile };
            } else {
              toast.error('خطا در همگام‌سازی سبد خرید');
              return { success: false, error: 'Cart sync failed' };
            }
          } else {
            throw new Error('کاربر یافت نشد');
          }
        }
      } catch (error: any) {
        toast.error(error.message || 'کد تایید نامعتبر است');
        return { success: false, error: error.message };
      }
    },
    [syncCart, router]
  );

  const completeProfile = useCallback(
    async (firstName: string, lastName: string) => {
      try {
        const result = await completeProfileAction({
          data: { firstName, lastName },
        });

        if (result.success) {
          toast.success('پروفایل شما تکمیل شد');
          router.navigate({ to: '/' });
          return { success: true };
        }
      } catch (error: any) {
        toast.error(error.message || 'خطا در تکمیل پروفایل');
        return { success: false, error: error.message };
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await logoutAction();
      logoutCart(); // Clear cart state
      toast.success('خروج موفقیت‌آمیز');
      router.navigate({ to: '/' });
      return { success: true };
    } catch (error: any) {
      toast.error(error.message || 'خطا در خروج');
      return { success: false, error: error.message };
    }
  }, [logoutCart, router]);

  const getCurrentUserData = useCallback(async (): Promise<User | null> => {
    try {
      const user = await getCurrentUser();
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }, []);

  return {
    // State
    isLoggedIn,
    userId,

    // Actions
    sendVerificationCode,
    verifyCode,
    completeProfile,
    logout,
    getCurrentUserData,
    checkAuthStatus,
  };
}
