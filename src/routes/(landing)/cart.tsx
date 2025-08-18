import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Package,
  Tag,
  Loader2,
} from 'lucide-react';
import { formatPrice } from '@/features/cart/utils';
import { useCart } from '@/features/cart/cart-provider';
import { getProductOptions } from '@/features/product/front/fetchers';
import { toast } from 'sonner';

export const Route = createFileRoute('/(landing)/cart')({
  component: CartPage,
});

function CartPage() {
  const { items, totalItems, totalPrice, updateItem, removeItem, isEmpty } =
    useCart();

  if (isEmpty) {
    return <EmptyCart />;
  }

  return (
    <div className='container mx-auto px-4 py-8 max-w-6xl'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-right mb-2'>سبد خرید</h1>
        <p className='text-muted-foreground text-right'>
          {totalItems} کالا در سبد خرید شما
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Cart Items */}
        <div className='lg:col-span-2 space-y-4'>
          {items.map((item) => (
            <CartItem
              key={`${item.productId}-${JSON.stringify(item.selectedOptions)}`}
              item={item}
              onUpdateQuantity={(quantity) =>
                updateItem(item.productId, item.selectedOptions, quantity)
              }
              onRemove={() => removeItem(item.productId, item.selectedOptions)}
            />
          ))}
        </div>

        {/* Cart Summary */}
        <div className='lg:col-span-1'>
          <Card className='sticky top-4'>
            <CardHeader>
              <CardTitle className='text-right'>خلاصه سفارش</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between'>
                <span>تعداد کالا:</span>
                <span>{totalItems} عدد</span>
              </div>

              <Separator />

              <div className='flex justify-between items-center'>
                <span className='font-semibold'>مجموع:</span>
                <span className='font-bold text-lg'>
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <Button className='w-full' size='lg'>
                ادامه خرید
                <ArrowLeft className='mr-2 h-4 w-4' />
              </Button>

              <Link to='/categories'>
                <Button variant='outline' className='w-full'>
                  مشاهده محصولات بیشتر
                  <ArrowRight className='mr-2 h-4 w-4' />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className='container mx-auto px-4 py-16 max-w-2xl text-center'>
      <ShoppingCart className='h-24 w-24 mx-auto text-muted-foreground mb-6' />
      <h1 className='text-2xl font-bold mb-4'>سبد خرید شما خالی است</h1>
      <p className='text-muted-foreground mb-8'>
        هنوز هیچ محصولی به سبد خرید خود اضافه نکرده‌اید
      </p>
      <Link to='/categories'>
        <Button size='lg'>
          مشاهده محصولات
          <ArrowRight className='mr-2 h-4 w-4' />
        </Button>
      </Link>
    </div>
  );
}

interface CartItemProps {
  item: {
    productId: number;
    quantity: number;
    unitPrice: number;
    selectedOptions: { optionGroupId: number; optionId: number }[];
    product?: {
      name: string;
      imageUrl: string | null;
    };
  };
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [optionDetails, setOptionDetails] = useState<any[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  const totalPrice = item.quantity * item.unitPrice;

  // Load option details on mount
  useEffect(() => {
    if (item.selectedOptions && item.selectedOptions.length > 0) {
      loadOptionDetails();
    } else {
      setOptionsLoaded(true);
    }
  }, [item.productId, item.selectedOptions]);

  const loadOptionDetails = async () => {
    try {
      const allOptions = await getProductOptions({ data: item.productId });

      const selectedDetails = item.selectedOptions
        .map((selected) => {
          const group = allOptions.find(
            (g: any) => g.id === selected.optionGroupId
          );
          if (group) {
            const option = group.options.find(
              (o: any) => o.id === selected.optionId
            );
            if (option) {
              return {
                groupName: group.name,
                optionName: option.name,
                priceModifier: option.priceModifier,
              };
            }
          }
          return null;
        })
        .filter(Boolean);

      setOptionDetails(selectedDetails);
      setOptionsLoaded(true);
    } catch (error) {
      console.error('Failed to load option details:', error);
      setOptionsLoaded(true);
    }
  };

  const handleQuantityUpdate = async (newQuantity: number) => {
    if (newQuantity < 1) return;

    setIsUpdating(true);
    try {
      await onUpdateQuantity(newQuantity);
    } catch (error) {
      toast.error('خطا در به‌روزرسانی تعداد');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      await onRemove();
      toast.success('محصول از سبد خرید حذف شد');
    } catch (error) {
      toast.error('خطا در حذف محصول');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className='overflow-hidden'>
      <CardContent className='p-0'>
        <div className='flex gap-4 p-4'>
          {/* Product Image */}
          <div className='flex-shrink-0'>
            {item.product?.imageUrl ? (
              <img
                src={item.product.imageUrl}
                alt={item.product.name || 'محصول'}
                className='w-24 h-24 object-cover rounded-lg border'
              />
            ) : (
              <div className='w-24 h-24 bg-muted rounded-lg border flex items-center justify-center'>
                <Package className='h-8 w-8 text-muted-foreground' />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className='flex-1 space-y-3'>
            <div className='flex justify-between items-start'>
              <div className='space-y-1'>
                <h3 className='font-semibold text-right text-lg'>
                  {item.product?.name || 'محصول'}
                </h3>

                {/* Selected Options */}
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                  <div className='space-y-2'>
                    {!optionsLoaded ? (
                      <div className='space-y-1'>
                        <Skeleton className='h-4 w-32' />
                        <Skeleton className='h-4 w-24' />
                      </div>
                    ) : optionDetails.length > 0 ? (
                      <div className='space-y-1'>
                        {optionDetails.map((detail: any, index: number) => (
                          <div
                            key={index}
                            className='flex items-center gap-2 text-sm'>
                            <Tag className='h-3 w-3 text-muted-foreground' />
                            <span className='text-muted-foreground'>
                              {detail.groupName}:
                            </span>
                            <Badge variant='secondary' className='text-xs'>
                              {detail.optionName}
                            </Badge>
                            {detail.priceModifier !== 0 && (
                              <span
                                className={`text-xs ${
                                  detail.priceModifier > 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}>
                                {detail.priceModifier > 0 ? '+' : ''}
                                {formatPrice(detail.priceModifier)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='text-sm text-muted-foreground text-right'>
                        گزینه‌های انتخابی: {item.selectedOptions.length} مورد
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Remove Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    disabled={isUpdating}
                    className='text-destructive hover:text-destructive hover:bg-destructive/10'>
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className='text-right'>
                      حذف محصول
                    </AlertDialogTitle>
                    <AlertDialogDescription className='text-right'>
                      آیا مطمئن هستید که می‌خواهید این محصول را از سبد خرید حذف
                      کنید؟
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className='flex-row-reverse'>
                    <AlertDialogAction
                      onClick={handleRemove}
                      className='bg-destructive hover:bg-destructive/90'>
                      حذف
                    </AlertDialogAction>
                    <AlertDialogCancel>انصراف</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Quantity and Price */}
            <div className='flex justify-between items-center'>
              {/* Quantity Controls */}
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleQuantityUpdate(item.quantity - 1)}
                  disabled={item.quantity <= 1 || isUpdating}>
                  <Minus className='h-3 w-3' />
                </Button>

                <div className='w-12 text-center py-1 px-2 border rounded text-sm'>
                  {isUpdating ? (
                    <Loader2 className='h-3 w-3 animate-spin mx-auto' />
                  ) : (
                    item.quantity
                  )}
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleQuantityUpdate(item.quantity + 1)}
                  disabled={isUpdating}>
                  <Plus className='h-3 w-3' />
                </Button>
              </div>

              {/* Price */}
              <div className='text-left space-y-1'>
                <div className='font-bold text-lg'>
                  {formatPrice(totalPrice)}
                </div>
                {item.quantity > 1 && (
                  <div className='text-xs text-muted-foreground'>
                    {formatPrice(item.unitPrice)} × {item.quantity}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
