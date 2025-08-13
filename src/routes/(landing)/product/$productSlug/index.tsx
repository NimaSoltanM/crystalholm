import { createFileRoute, Link, Await } from '@tanstack/react-router';
import {
  getProduct,
  getProductOptions,
} from '@/features/product/front/fetchers';
import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Package,
  Check,
  Plus,
  Minus,
  Share2,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const fakeDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const Route = createFileRoute('/(landing)/product/$productSlug/')({
  loader: async ({ params }) => {
    const product = await getProduct({ data: params.productSlug });

    const optionsPromise = (async () => {
      await fakeDelay(Math.random() * 1500 + 500);
      return await getProductOptions({ data: product.id });
    })();

    return {
      product,
      deferredOptions: optionsPromise,
    };
  },
  component: ProductDetailPage,
});

function OptionsSkeleton() {
  return (
    <div className='space-y-6'>
      {[1, 2].map((i) => (
        <div key={i} className='space-y-3'>
          <Skeleton className='h-5 w-24' />
          <div className='grid grid-cols-3 gap-2'>
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className='h-12 w-full rounded-lg' />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductOptions({
  optionGroups,
  selectedOptions,
  onOptionChange,
}: {
  optionGroups: any[];
  selectedOptions: Record<number, number>;
  onOptionChange: (groupId: number, optionId: number) => void;
}) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  if (optionGroups.length === 0) {
    return null;
  }

  return (
    <div className='space-y-6'>
      {optionGroups.map((group) => (
        <div key={group.id} className='space-y-3'>
          <div className='flex items-center gap-2'>
            <Label className='text-sm font-medium'>{group.name}</Label>
            {group.isRequired && (
              <Badge variant='secondary' className='text-xs'>
                الزامی
              </Badge>
            )}
          </div>

          <RadioGroup
            value={selectedOptions[group.id]?.toString() || ''}
            onValueChange={(value) => onOptionChange(group.id, parseInt(value))}
            className='grid grid-cols-2 sm:grid-cols-3 gap-2'
            dir='rtl'>
            {group.options.map((option: any) => {
              const isSelected = selectedOptions[group.id] === option.id;
              return (
                <div key={option.id}>
                  <RadioGroupItem
                    value={option.id.toString()}
                    id={`option-${option.id}`}
                    className='peer sr-only'
                  />
                  <Label
                    htmlFor={`option-${option.id}`}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all',
                      'hover:bg-accent',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-muted',
                      !option.isAvailable && 'opacity-50 cursor-not-allowed'
                    )}>
                    <span className='text-sm font-medium'>{option.name}</span>
                    {option.priceModifier !== 0 && (
                      <span
                        className={cn(
                          'text-xs',
                          option.priceModifier > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}>
                        {option.priceModifier > 0 ? '+' : ''}
                        {formatPrice(option.priceModifier)}
                      </span>
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>
      ))}
    </div>
  );
}

function ProductDetailPage() {
  const { product, deferredOptions } = Route.useLoaderData();
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, number>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(product.basePrice);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const handleOptionChange = (groupId: number, optionId: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupId]: optionId,
    }));
  };

  useEffect(() => {
    let price = product.basePrice;

    deferredOptions.then((optionGroups) => {
      Object.entries(selectedOptions).forEach(([groupId, optionId]) => {
        const group = optionGroups.find((g: any) => g.id === parseInt(groupId));
        if (group) {
          const option = group.options.find((o: any) => o.id === optionId);
          if (option) {
            price += option.priceModifier;
          }
        }
      });
      setTotalPrice(price);
    });
  }, [selectedOptions, product.basePrice, deferredOptions]);

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    await fakeDelay(1000);
    console.log('Adding to cart:', {
      product: product.id,
      selectedOptions,
      quantity,
      totalPrice: totalPrice * quantity,
    });
    setIsAddingToCart(false);
  };

  return (
    <div className='min-h-screen bg-background' dir='rtl'>
      <div className='container mx-auto px-4 py-6'>
        <div className='mb-6'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Link to='/' className='hover:text-foreground transition-colors'>
              خانه
            </Link>
            <ChevronLeft className='h-3 w-3' />
            <Link
              to='/categories'
              className='hover:text-foreground transition-colors'>
              دسته‌بندی‌ها
            </Link>
            <ChevronLeft className='h-3 w-3' />
            <span className='text-foreground font-medium'>{product.name}</span>
          </div>
        </div>

        <div className='grid lg:grid-cols-2 gap-8'>
          <div className='space-y-4'>
            <Card className='overflow-hidden'>
              <div className='aspect-square relative bg-muted'>
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <Package className='h-20 w-20 text-muted-foreground' />
                  </div>
                )}
              </div>
            </Card>

            <div className='flex gap-2'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant='outline' size='icon'>
                      <Share2 className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>اشتراک‌گذاری</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant='outline' size='icon'>
                      <Heart className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>افزودن به علاقه‌مندی‌ها</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className='space-y-6'>
            <div>
              <h1 className='text-2xl md:text-3xl font-bold mb-2'>
                {product.name}
              </h1>
              {product.sku && (
                <p className='text-sm text-muted-foreground'>
                  کد محصول: {product.sku}
                </p>
              )}
            </div>

            {product.description && (
              <div className='prose prose-sm max-w-none'>
                <p className='text-muted-foreground leading-relaxed'>
                  {product.description}
                </p>
              </div>
            )}

            <Separator />

            <Await promise={deferredOptions} fallback={<OptionsSkeleton />}>
              {(optionGroups) => {
                useEffect(() => {
                  const defaults: Record<number, number> = {};
                  optionGroups.forEach((group: any) => {
                    const defaultOption = group.options.find(
                      (o: any) => o.isDefault
                    );
                    if (defaultOption) {
                      defaults[group.id] = defaultOption.id;
                    } else if (group.isRequired && group.options.length > 0) {
                      defaults[group.id] = group.options[0].id;
                    }
                  });
                  setSelectedOptions(defaults);
                }, [optionGroups]);

                return (
                  <ProductOptions
                    optionGroups={optionGroups}
                    selectedOptions={selectedOptions}
                    onOptionChange={handleOptionChange}
                  />
                );
              }}
            </Await>

            <Separator />

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>
                  قیمت نهایی:
                </span>
                <div className='text-right'>
                  <p className='text-2xl font-bold'>
                    {formatPrice(totalPrice * quantity)}
                  </p>
                  <p className='text-sm text-muted-foreground'>تومان</p>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                <div className='flex items-center border rounded-lg'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className='rounded-none'>
                    <Minus className='h-4 w-4' />
                  </Button>
                  <span className='px-4 py-2 min-w-[50px] text-center'>
                    {formatPrice(quantity)}
                  </span>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setQuantity(quantity + 1)}
                    className='rounded-none'>
                    <Plus className='h-4 w-4' />
                  </Button>
                </div>

                <Button
                  className='flex-1'
                  size='lg'
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}>
                  {isAddingToCart ? (
                    <span className='flex items-center gap-2'>
                      <span className='animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full' />
                      در حال افزودن...
                    </span>
                  ) : (
                    <span className='flex items-center gap-2'>
                      <ShoppingCart className='h-5 w-5' />
                      افزودن به سبد خرید
                    </span>
                  )}
                </Button>
              </div>
            </div>

            <Card className='bg-muted/30'>
              <CardContent className='p-4'>
                <div className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <Check className='h-4 w-4 text-green-600' />
                    <span className='text-sm'>ضمانت اصالت کالا</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Check className='h-4 w-4 text-green-600' />
                    <span className='text-sm'>ارسال سریع</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Check className='h-4 w-4 text-green-600' />
                    <span className='text-sm'>پشتیبانی ۲۴ ساعته</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
