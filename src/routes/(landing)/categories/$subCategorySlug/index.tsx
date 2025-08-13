import { createFileRoute, Link, Await } from '@tanstack/react-router';
import { getProducts } from '@/features/product/front/fetchers';
import { getSubcategory } from '@/features/category/front/fetchers';
import { z } from 'zod';
import {
  Search,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const productSearchSchema = z.object({
  page: z.number().catch(1),
  search: z.string().catch(''),
  sortBy: z.enum(['name', 'price', 'newest']).catch('name'),
  sortOrder: z.enum(['asc', 'desc']).catch('asc'),
  view: z.enum(['grid', 'list']).catch('grid'),
});

const fakeDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const Route = createFileRoute('/(landing)/categories/$subCategorySlug/')(
  {
    validateSearch: productSearchSchema,
    loaderDeps: ({ search: { page, search, sortBy, sortOrder } }) => ({
      page,
      search,
      sortBy,
      sortOrder,
    }),
    loader: async ({ params, deps }) => {
      const subcategory = await getSubcategory({
        data: params.subCategorySlug,
      });

      const productsPromise = (async () => {
        await fakeDelay(Math.random() * 2000 + 1000);
        return await getProducts({
          data: {
            subcategoryId: subcategory.id,
            page: deps.page,
            limit: 12,
            search: deps.search || undefined,
            sortBy: deps.sortBy,
            sortOrder: deps.sortOrder,
          },
        });
      })();

      return {
        subcategory,
        deferredProducts: productsPromise,
      };
    },
    component: ProductsPage,
  }
);

function ProductSkeleton({ view }: { view: 'grid' | 'list' }) {
  if (view === 'grid') {
    return (
      <Card className='overflow-hidden h-full'>
        <Skeleton className='aspect-square w-full' />
        <CardContent className='p-3'>
          <Skeleton className='h-4 w-3/4 mb-2' />
          <Skeleton className='h-5 w-1/2' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='overflow-hidden'>
      <CardContent className='p-4 flex gap-4'>
        <Skeleton className='w-20 h-20 rounded flex-shrink-0' />
        <div className='flex-1'>
          <Skeleton className='h-5 w-3/4 mb-2' />
          <Skeleton className='h-4 w-full mb-2' />
          <Skeleton className='h-5 w-1/3' />
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingProducts({ view }: { view: 'grid' | 'list' }) {
  if (view === 'grid') {
    return (
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
        {[...Array(12)].map((_, i) => (
          <ProductSkeleton key={i} view='grid' />
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      {[...Array(6)].map((_, i) => (
        <ProductSkeleton key={i} view='list' />
      ))}
    </div>
  );
}

function ProductsContent({
  products,
  pagination,
  view,
  search,
  page,
}: {
  products: any[];
  pagination: any;
  view: 'grid' | 'list';
  search: string;
  page: number;
}) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  if (products.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16'>
        <Package className='h-12 w-12 text-muted-foreground mb-4' />
        <h3 className='text-lg font-semibold mb-2'>محصولی یافت نشد</h3>
        <p className='text-muted-foreground'>نتیجه ای یافت نشد.</p>
      </div>
    );
  }

  return (
    <>
      {view === 'grid' ? (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          {products.map((product) => (
            <Link
              key={product.id}
              to={'/product/$productSlug'}
              params={{ productSlug: product.slug }}
              className='group'>
              <Card className='overflow-hidden h-full hover:shadow-md transition-shadow'>
                <div className='aspect-square bg-muted'>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center'>
                      <Package className='h-8 w-8 text-muted-foreground' />
                    </div>
                  )}
                </div>
                <CardContent className='p-3'>
                  <h3 className='text-sm mb-1 line-clamp-2'>{product.name}</h3>
                  <p className='font-bold'>
                    {formatPrice(product.basePrice)} تومان
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className='space-y-2'>
          {products.map((product) => (
            <a
              key={product.id}
              href={`/product/${product.slug}`}
              className='block'>
              <Card className='overflow-hidden hover:shadow-md transition-shadow'>
                <CardContent className='p-4 flex gap-4'>
                  <div className='w-20 h-20 bg-muted rounded flex-shrink-0'>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className='w-full h-full object-cover rounded'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center'>
                        <Package className='h-6 w-6 text-muted-foreground' />
                      </div>
                    )}
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-medium mb-1'>{product.name}</h3>
                    {product.description && (
                      <p className='text-sm text-muted-foreground line-clamp-1 mb-2'>
                        {product.description}
                      </p>
                    )}
                    <p className='font-bold'>
                      {formatPrice(product.basePrice)} تومان
                    </p>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className='flex items-center justify-center gap-2 mt-8'>
          <Link
            from={Route.fullPath}
            search={(prev) => ({ ...prev, page: Math.max(1, page - 1) })}
            disabled={!pagination.hasPrev}
            className={cn(
              'p-2',
              !pagination.hasPrev && 'opacity-50 pointer-events-none'
            )}>
            <ChevronRight className='h-4 w-4' />
          </Link>

          <div className='flex gap-1'>
            {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <Link
                  key={i}
                  from={Route.fullPath}
                  search={(prev) => ({ ...prev, page: pageNum })}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded',
                    pageNum === page
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}>
                  {formatPrice(pageNum)}
                </Link>
              );
            })}
          </div>

          <Link
            from={Route.fullPath}
            search={(prev) => ({
              ...prev,
              page: Math.min(pagination.totalPages, page + 1),
            })}
            disabled={!pagination.hasNext}
            className={cn(
              'p-2',
              !pagination.hasNext && 'opacity-50 pointer-events-none'
            )}>
            <ChevronLeft className='h-4 w-4' />
          </Link>
        </div>
      )}
    </>
  );
}

function ProductsPage() {
  const { subcategory, deferredProducts } = Route.useLoaderData();
  const { page, search, sortBy, sortOrder, view } = Route.useSearch();

  return (
    <div className='min-h-screen bg-background' dir='rtl'>
      <div className='container mx-auto px-4 py-6'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold mb-2'>{subcategory.name}</h1>
          <Await
            promise={deferredProducts}
            fallback={<Skeleton className='h-5 w-24' />}>
            {(data) => (
              <p className='text-muted-foreground'>
                {data.pagination.totalCount} محصول
              </p>
            )}
          </Await>
        </div>

        <div className='flex flex-col md:flex-row gap-4 mb-6'>
          <form className='flex-1 max-w-md'>
            <div className='relative'>
              <Search className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
              <Input
                type='search'
                placeholder='جستجو...'
                defaultValue={search}
                className='pr-10'
                dir='rtl'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value;
                    window.location.href = `?${new URLSearchParams({
                      ...Object.fromEntries(
                        new URLSearchParams(window.location.search)
                      ),
                      search: value,
                      page: '1',
                    }).toString()}`;
                  }
                }}
              />
            </div>
          </form>

          <div className='flex items-center gap-2'>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-');
                window.location.href = `?${new URLSearchParams({
                  ...Object.fromEntries(
                    new URLSearchParams(window.location.search)
                  ),
                  sortBy: newSortBy,
                  sortOrder: newSortOrder,
                  page: '1',
                }).toString()}`;
              }}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir='rtl'>
                <SelectItem value='name-asc'>نام (الف تا ی)</SelectItem>
                <SelectItem value='name-desc'>نام (ی تا الف)</SelectItem>
                <SelectItem value='price-asc'>قیمت (کم به زیاد)</SelectItem>
                <SelectItem value='price-desc'>قیمت (زیاد به کم)</SelectItem>
                <SelectItem value='newest-desc'>جدیدترین</SelectItem>
              </SelectContent>
            </Select>

            <div className='flex gap-1'>
              <Link
                from={Route.fullPath}
                search={(prev) => ({ ...prev, view: 'grid' })}
                className={cn(
                  'p-2 rounded',
                  view === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}>
                <Grid3x3 className='h-4 w-4' />
              </Link>
              <Link
                from={Route.fullPath}
                search={(prev) => ({ ...prev, view: 'list' })}
                className={cn(
                  'p-2 rounded',
                  view === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}>
                <List className='h-4 w-4' />
              </Link>
            </div>
          </div>
        </div>

        <Await
          promise={deferredProducts}
          fallback={<LoadingProducts view={view} />}>
          {(data) => (
            <ProductsContent
              products={data.products}
              pagination={data.pagination}
              view={view}
              search={search}
              page={page}
            />
          )}
        </Await>
      </div>
    </div>
  );
}
