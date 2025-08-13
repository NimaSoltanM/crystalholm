import { useState } from 'react';
import { Grid3x2, Grid3x3, Search } from 'lucide-react';
import { SearchBar } from './search-bar';
import { UserMenu } from './user-menu';
import { CartButton } from './cart-button';
import { MegaMenu } from './mega-menu';
import { NavLinks } from './nav-links';
import type { NavbarParentCategory, BaseNavbarProps } from '../types';
import { getSubcategories } from '@/features/category/front/fetchers';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

interface NavbarProps extends BaseNavbarProps {
  parentCategories: NavbarParentCategory[];
}

export default function Navbar({
  parentCategories,
  user,
  cartItemsCount = 0,
  onSearch,
  onLogin,
  onLogout,
}: NavbarProps) {
  const [categoriesData, setCategoriesData] =
    useState<NavbarParentCategory[]>(parentCategories);
  const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(
    null
  );

  const handleLoadSubcategories = async (categoryId: number): Promise<void> => {
    const category = categoriesData.find((c) => c.id === categoryId);
    if (category?.subcategories) return;

    try {
      setLoadingCategoryId(categoryId);
      const subs = await getSubcategories({ data: categoryId });
      setCategoriesData((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, subcategories: subs } : c
        )
      );
    } catch (error) {
      console.error('Failed to load subcategories:', error);
    } finally {
      setLoadingCategoryId(null);
    }
  };

  return (
    <>
      <header className='hidden lg:block border-b bg-background' dir='rtl'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex items-center justify-between gap-4'>
            <Link to='/'>
              <h1 className='text-2xl font-bold bg-gradient-to-r from-[#3D8DF3] to-[#53C8F7] bg-clip-text text-transparent'>
                Crystalhom❄️
              </h1>
            </Link>
            <SearchBar onSearch={onSearch} />
            <div className='flex items-center'>
              <div className='ml-2'>
                <UserMenu user={user} onLogin={onLogin} onLogout={onLogout} />
              </div>
              <CartButton itemsCount={cartItemsCount} />
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className='border-t bg-muted/30'>
          <div className='container mx-auto px-4 py-3'>
            <nav className='flex items-center space-x-6 space-x-reverse'>
              <Link to='/categories'>
                <Button className='h-9 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer'>
                  <Grid3x3 className='ml-2 h-4 w-4' />
                  دسته‌بندی کالاها
                </Button>
              </Link>
              <NavLinks />
            </nav>
          </div>
        </div>
      </header>
      {/* Mobile Header - Hidden on Desktop */}
      <div className='lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border px-3 py-2 sm:px-4 sm:py-3'>
        <div className='flex items-center gap-2 sm:gap-4'>
          {/* Logo - Responsive sizing */}
          <div className='flex items-center flex-shrink-0'>
            <h1 className='text-base sm:text-lg font-bold bg-gradient-to-r from-[#3D8DF3] to-[#53C8F7] bg-clip-text text-transparent whitespace-nowrap'>
              Crystalhom❄️
            </h1>
          </div>

          {/* Mobile Search Bar - Takes remaining space */}
          <div className='flex-1 min-w-0'>
            <div className='relative'>
              <Search className='absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5 sm:h-4 sm:w-4' />
              <input
                type='text'
                placeholder='جستجو...'
                className='w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-1.5 sm:py-2 text-xs sm:text-sm border border-border rounded-md sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-muted/30 placeholder:text-muted-foreground'
                dir='rtl'
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Content Spacer */}
      <div className='lg:hidden h-12 sm:h-16'></div>{' '}
    </>
  );
}
