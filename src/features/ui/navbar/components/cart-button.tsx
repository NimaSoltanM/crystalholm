import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CartButtonProps {
  itemsCount?: number;
  onClick?: () => void;
}

export function CartButton({ itemsCount = 0, onClick }: CartButtonProps) {
  return (
    <Button
      variant='outline'
      size='icon'
      className='relative h-10 w-10'
      onClick={onClick}>
      <ShoppingBag className='h-5 w-5' />
      {itemsCount > 0 && (
        <Badge className='absolute -top-2 -left-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-600'>
          {itemsCount > 9 ? '9+' : itemsCount}
        </Badge>
      )}
    </Button>
  );
}
