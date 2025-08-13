import React from 'react';
import {
  ChevronDown,
  User,
  LogIn,
  Settings,
  Package,
  Heart,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { NavbarUser } from '../types';

interface UserMenuProps {
  user: NavbarUser;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function UserMenu({ user, onLogin, onLogout }: UserMenuProps) {
  if (!user) {
    return (
      <Button onClick={onLogin} size='sm' className='h-10'>
        <LogIn className='ml-2 h-4 w-4' />
        ورود | ثبت نام
      </Button>
    );
  }

  return (
    <DropdownMenu dir='rtl'>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' className='h-10'>
          <div className='flex items-center'>
            <UserCircle className='w-6 h-6 ml-2' />
            <ChevronDown className='w-4 h-4' />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel>حساب کاربری</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className='ml-2 h-4 w-4' />
          <span>پروفایل</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Package className='ml-2 h-4 w-4' />
          <span>سفارش‌های من</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Heart className='ml-2 h-4 w-4' />
          <span>علاقه‌مندی‌ها</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className='ml-2 h-4 w-4' />
          <span>تنظیمات</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} variant='destructive'>
          <LogOut className='ml-2 h-4 w-4' />
          <span>خروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
