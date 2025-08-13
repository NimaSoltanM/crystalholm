import React, { useState } from 'react';
import { Home, User, ShoppingCart, Grid3x3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BottomNavProps {
  cartItemsCount?: number;
  user?: any; // Replace with your user type
  onLogin?: () => void;
  onLogout?: () => void;
  onNavigate?: (tab: string) => void;
}

export function BottomNavigation({
  cartItemsCount = 0,
  user,
  onLogin,
  onLogout,
  onNavigate,
}: BottomNavProps) {
  const [activeTab, setActiveTab] = useState('home');

  const navItems = [
    {
      id: 'home',
      label: 'خانه',
      icon: Home,
      badge: null,
    },
    {
      id: 'categories',
      label: 'دسته‌بندی',
      icon: Grid3x3,
      badge: null,
    },
    {
      id: 'cart',
      label: 'سبد خرید',
      icon: ShoppingCart,
      badge: cartItemsCount > 0 ? cartItemsCount : null,
    },
    {
      id: 'user',
      label: 'حساب کاربری',
      icon: User,
      badge: null,
    },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);

    // Handle specific navigation logic
    if (tabId === 'user') {
      if (!user) {
        onLogin?.();
      } else {
        // Navigate to user profile or show user menu
        onNavigate?.(tabId);
      }
    } else {
      onNavigate?.(tabId);
    }
  };

  return (
    <div className='lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border'>
      <div className='flex items-center justify-around px-2 py-2'>
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}>
              <div className='relative'>
                <IconComponent
                  className={`h-5 w-5 transition-all duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
                {item.badge && (
                  <Badge
                    variant='destructive'
                    className='absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center min-w-[16px]'>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span
                className={`text-xs mt-1 font-medium transition-all duration-200 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
