import { createFileRoute, Await, Link } from '@tanstack/react-router';
import {
  getParentCategories,
  getSubcategories,
} from '@/features/category/front/fetchers';
import { useState, Suspense } from 'react';
import {
  ChevronLeft,
  Grid3x3,
  List,
  Search,
  ArrowRight,
  Layers,
  FolderOpen,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

const fakeDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const Route = createFileRoute('/(landing)/categories/')({
  loader: async () => {
    const parentCats = await getParentCategories();

    const subcategoriesPromise = Promise.all(
      parentCats.map(async (parent) => {
        await fakeDelay(Math.random() * 2000 + 1000);
        const subs = await getSubcategories({ data: parent.id });
        return {
          parentId: parent.id,
          subcategories: subs,
        };
      })
    );

    return {
      categories: parentCats,
      deferredSubcategories: subcategoriesPromise,
    };
  },
  component: CategoriesPage,
});

function SubcategoryLoader() {
  return (
    <div className='space-y-2'>
      {[1, 2, 3].map((i) => (
        <div key={i} className='p-3 rounded-lg'>
          <Skeleton className='h-4 w-3/4' />
        </div>
      ))}
    </div>
  );
}

function SubcategoriesContent({ category, subcategories, viewMode }: any) {
  const subs =
    subcategories.find((s: any) => s.parentId === category.id)?.subcategories ||
    [];

  if (viewMode === 'grid') {
    return (
      <div className='space-y-2'>
        {subs.map((sub: any) => (
          <Link
            key={sub.id}
            to='/categories/$subCategoryId'
            params={{ subCategoryId: sub.slug }}
            search={{
              page: 1,
              search: '',
              sortBy: 'name',
              sortOrder: 'asc',
              view: 'grid',
            }}
            className='block p-3 rounded-lg hover:bg-muted transition-colors'>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>{sub.name}</span>
              <ChevronLeft className='h-4 w-4 text-muted-foreground' />
            </div>
          </Link>
        ))}
        {subs.length === 0 && (
          <p className='text-sm text-muted-foreground text-center py-8'>
            زیردسته‌ای موجود نیست
          </p>
        )}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2' dir='rtl'>
      {subs.map((sub: any) => (
        <Link
          key={sub.id}
          to='/categories/$subCategoryId'
          params={{ subCategoryId: sub.slug }}
          search={{
            page: 1,
            search: '',
            sortBy: 'name',
            sortOrder: 'asc',
            view: 'grid',
          }}
          className='flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group'>
          <span className='text-sm'>{sub.name}</span>
          <ChevronLeft className='h-4 w-4 text-muted-foreground group-hover:-translate-x-0.5 transition-transform' />
        </Link>
      ))}
      {subs.length === 0 && (
        <p className='text-sm text-muted-foreground col-span-2 text-center py-4'>
          زیردسته‌ای موجود نیست
        </p>
      )}
    </div>
  );
}

function CategoriesPage() {
  const { categories, deferredSubcategories } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const filteredCategories = categories.filter((category) => {
    return category.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className='min-h-screen bg-background' dir='rtl'>
      <div className='relative bg-gradient-to-b from-muted/50 to-background border-b'>
        <div className='container mx-auto px-4 py-8 md:py-12'>
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => window.history.back()}
                className='rounded-full'>
                <ArrowRight className='h-4 w-4' />
              </Button>
              <h1 className='text-3xl md:text-4xl font-bold'>دسته‌بندی‌ها</h1>
            </div>

            <p className='text-muted-foreground max-w-2xl'>
              همه دسته‌بندی‌ها و زیردسته‌های فروشگاه را مرور کنید
            </p>

            <div className='flex flex-wrap gap-4 mt-4'>
              <div className='flex items-center gap-2'>
                <div className='p-2 rounded-lg bg-primary/10'>
                  <FolderOpen className='h-4 w-4 text-primary' />
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>دسته‌های اصلی</p>
                  <p className='font-semibold'>{categories.length}</p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <div className='p-2 rounded-lg bg-primary/10'>
                  <Tag className='h-4 w-4 text-primary' />
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>زیردسته‌ها</p>
                  <Await
                    promise={deferredSubcategories}
                    fallback={<Skeleton className='h-5 w-8' />}>
                    {(subcategories) => {
                      const total = subcategories.reduce(
                        (acc: number, item: any) =>
                          acc + (item.subcategories?.length || 0),
                        0
                      );
                      return <p className='font-semibold'>{total}</p>;
                    }}
                  </Await>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-6'>
        <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
          <div className='relative w-full sm:max-w-md'>
            <Search className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
            <Input
              type='search'
              placeholder='جستجو در دسته‌بندی‌ها...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pr-10'
              dir='rtl'
            />
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size='icon'
              onClick={() => setViewMode('grid')}
              className='rounded-lg'>
              <Grid3x3 className='h-4 w-4' />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size='icon'
              onClick={() => setViewMode('list')}
              className='rounded-lg'>
              <List className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 pb-12'>
        <Tabs defaultValue='all' className='w-full' dir='rtl'>
          <TabsList className='grid w-full max-w-md mx-auto grid-cols-2 mb-8'>
            <TabsTrigger value='all'>همه دسته‌ها</TabsTrigger>
            <TabsTrigger value='popular'>پربازدیدترین‌ها</TabsTrigger>
          </TabsList>

          <TabsContent value='all' className='space-y-6'>
            {viewMode === 'grid' ? (
              <div
                className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                style={{ direction: 'rtl' }}>
                {filteredCategories.map((category) => (
                  <Card
                    key={category.id}
                    className='group hover:shadow-lg transition-all duration-300 overflow-hidden'>
                    <CardHeader className='pb-3'>
                      <div className='flex items-center justify-between'>
                        <CardTitle className='text-lg flex items-center gap-2'>
                          <Layers className='h-5 w-5 text-primary' />
                          {category.name}
                        </CardTitle>
                        <Await
                          promise={deferredSubcategories}
                          fallback={<Skeleton className='h-5 w-12' />}>
                          {(subcategories) => {
                            const count =
                              subcategories.find(
                                (s: any) => s.parentId === category.id
                              )?.subcategories?.length || 0;
                            return (
                              <Badge variant='secondary' className='text-xs'>
                                {count} زیردسته
                              </Badge>
                            );
                          }}
                        </Await>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className='h-[200px] w-full' dir='rtl'>
                        <div className='pl-4'>
                          <Await
                            promise={deferredSubcategories}
                            fallback={<SubcategoryLoader />}>
                            {(subcategories) => (
                              <SubcategoriesContent
                                category={category}
                                subcategories={subcategories}
                                viewMode='grid'
                              />
                            )}
                          </Await>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className='max-w-4xl mx-auto' dir='rtl'>
                <Accordion
                  type='multiple'
                  value={expandedCategories}
                  className='space-y-4'>
                  {filteredCategories.map((category) => (
                    <AccordionItem
                      key={category.id}
                      value={category.id.toString()}
                      className='border rounded-lg px-4'>
                      <AccordionTrigger
                        onClick={() => toggleExpanded(category.id.toString())}
                        className='hover:no-underline [&[data-state=open]>svg]:rotate-90'>
                        <div className='flex items-center justify-between w-full ml-4'>
                          <div className='flex items-center gap-3'>
                            <div className='p-2 rounded-lg bg-primary/10'>
                              <Layers className='h-5 w-5 text-primary' />
                            </div>
                            <div className='text-right'>
                              <h3 className='font-semibold text-base'>
                                {category.name}
                              </h3>
                              <Await
                                promise={deferredSubcategories}
                                fallback={
                                  <Skeleton className='h-4 w-20 mt-1' />
                                }>
                                {(subcategories) => {
                                  const count =
                                    subcategories.find(
                                      (s: any) => s.parentId === category.id
                                    )?.subcategories?.length || 0;
                                  return (
                                    <p className='text-sm text-muted-foreground'>
                                      {count} زیردسته
                                    </p>
                                  );
                                }}
                              </Await>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Separator className='mb-4' />
                        <Await
                          promise={deferredSubcategories}
                          fallback={
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2'>
                              {[1, 2, 3, 4].map((i) => (
                                <Skeleton
                                  key={i}
                                  className='h-12 w-full rounded-lg'
                                />
                              ))}
                            </div>
                          }>
                          {(subcategories) => (
                            <SubcategoriesContent
                              category={category}
                              subcategories={subcategories}
                              viewMode='list'
                            />
                          )}
                        </Await>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {filteredCategories.length === 0 && (
              <div className='text-center py-12'>
                <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4'>
                  <Search className='h-8 w-8 text-muted-foreground' />
                </div>
                <h3 className='text-lg font-semibold mb-2'>
                  نتیجه‌ای یافت نشد
                </h3>
                <p className='text-muted-foreground'>
                  دسته‌بندی با عبارت "{searchQuery}" پیدا نشد
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value='popular' className='space-y-6'>
            <div className='text-center py-12'>
              <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4'>
                <Layers className='h-8 w-8 text-muted-foreground' />
              </div>
              <h3 className='text-lg font-semibold mb-2'>به‌زودی</h3>
              <p className='text-muted-foreground'>
                دسته‌بندی‌های پربازدید به‌زودی نمایش داده خواهند شد
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
