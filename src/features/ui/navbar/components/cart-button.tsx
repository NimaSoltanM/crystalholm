import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { useCart } from '@/features/cart/cart-provider';

export function CartButton() {
  const { totalItems, isEmpty } = useCart();

  return (
    <Link to='/cart'>
      <Button variant='outline' size='icon' className='relative h-10 w-10'>
        <ShoppingBag className='h-5 w-5' />

        {!isEmpty && (
          <Badge
            className={cn(
              'absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center',
              'text-xs font-bold bg-primary text-primary-foreground',
              'border-2 border-background',
              totalItems > 99 ? 'w-6' : 'w-5'
            )}>
            {totalItems > 99 ? '99+' : totalItems}
          </Badge>
        )}

        <span className='sr-only'>
          سبد خرید {!isEmpty && `(${totalItems} کالا)`}
        </span>
      </Button>
    </Link>
  );
}
