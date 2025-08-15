import {
  createFileRoute,
  Link,
  Await,
  useRouter,
} from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  getAllParentCategoriesAdmin,
  getAllSubcategoriesAdmin,
} from '@/features/category/front/fetchers';
import {
  deleteParentCategory,
  deleteSubcategory,
  toggleParentCategoryStatus,
  toggleSubcategoryStatus,
  bulkToggleCategoryStatus,
} from '@/features/category/front/actions';
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  FolderOpen,
  Tag,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  MoreVertical,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const fakeDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const Route = createFileRoute('/admin/categories/')({
  loader: async () => {
    const parentCategoriesPromise = (async () => {
      await fakeDelay(500);
      return await getAllParentCategoriesAdmin();
    })();

    const subcategoriesPromise = (async () => {
      await fakeDelay(800);
      return await getAllSubcategoriesAdmin();
    })();

    return {
      deferredParentCategories: parentCategoriesPromise,
      deferredSubcategories: subcategoriesPromise,
    };
  },
  component: AdminCategoriesPage,
});

function TableSkeleton() {
  return (
    <div className='space-y-3'>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className='flex items-center gap-4 p-4 border rounded-lg'>
          <Skeleton className='h-5 w-5' />
          <Skeleton className='h-5 flex-1' />
          <Skeleton className='h-5 w-20' />
          <Skeleton className='h-8 w-8' />
        </div>
      ))}
    </div>
  );
}

function AdminCategoriesPage() {
  const router = useRouter();
  const { deferredParentCategories, deferredSubcategories } =
    Route.useLoaderData();
  const [activeTab, setActiveTab] = useState<'parent' | 'sub'>('parent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id?: number;
    type?: 'parent' | 'sub';
    name?: string;
  }>({ open: false });
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedParents, setExpandedParents] = useState<number[]>([]);
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    deferredParentCategories.then(setParentCategories);
    deferredSubcategories.then(setSubcategories);
  }, [deferredParentCategories, deferredSubcategories]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await router.invalidate();
      // Re-fetch data after invalidation
      const [parents, subs] = await Promise.all([
        getAllParentCategoriesAdmin(),
        getAllSubcategoriesAdmin(),
      ]);
      setParentCategories(parents);
      setSubcategories(subs);
      // Clear selected items after refresh
      setSelectedItems([]);
      toast.success('داده‌ها به‌روزرسانی شد');
    } catch (error) {
      toast.error('خطا در بارگذاری اطلاعات');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;

    setIsDeleting(true);
    try {
      const result =
        deleteDialog.type === 'parent'
          ? await deleteParentCategory({ data: deleteDialog.id })
          : await deleteSubcategory({ data: deleteDialog.id });

      if (result.success) {
        toast.success('حذف با موفقیت انجام شد');
        // Remove deleted item from selected items if it was selected
        setSelectedItems((prev) => prev.filter((id) => id !== deleteDialog.id));
        await router.invalidate();
        // Re-fetch data
        const [parents, subs] = await Promise.all([
          getAllParentCategoriesAdmin(),
          getAllSubcategoriesAdmin(),
        ]);
        setParentCategories(parents);
        setSubcategories(subs);
      } else {
        toast.error(result.error || 'خطا در حذف');
      }
    } catch (error) {
      toast.error('خطا در حذف');
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false });
    }
  };

  const handleToggleStatus = async (id: number, type: 'parent' | 'sub') => {
    try {
      const result =
        type === 'parent'
          ? await toggleParentCategoryStatus({ data: id })
          : await toggleSubcategoryStatus({ data: id });

      if (result.success) {
        toast.success('وضعیت با موفقیت تغییر کرد');
        await router.invalidate();
        // Re-fetch data
        const [parents, subs] = await Promise.all([
          getAllParentCategoriesAdmin(),
          getAllSubcategoriesAdmin(),
        ]);
        setParentCategories(parents);
        setSubcategories(subs);
      } else {
        toast.error(result.error || 'خطا در تغییر وضعیت');
      }
    } catch (error) {
      toast.error('خطا در تغییر وضعیت');
    }
  };

  const handleBulkToggle = async (isActive: boolean) => {
    if (selectedItems.length === 0) {
      toast.error('هیچ آیتمی انتخاب نشده است');
      return;
    }

    try {
      const result = await bulkToggleCategoryStatus({
        data: {
          type: activeTab,
          ids: selectedItems,
          isActive,
        },
      });

      if (result.success) {
        toast.success(result.message || 'عملیات با موفقیت انجام شد');
        // Clear selected items after successful operation
        setSelectedItems([]);
        await router.invalidate();
        // Re-fetch data
        const [parents, subs] = await Promise.all([
          getAllParentCategoriesAdmin(),
          getAllSubcategoriesAdmin(),
        ]);
        setParentCategories(parents);
        setSubcategories(subs);
      } else {
        toast.error(result.error || 'خطا در انجام عملیات');
      }
    } catch (error) {
      toast.error('خطا در انجام عملیات');
    }
  };

  const toggleParentExpansion = (parentId: number) => {
    setExpandedParents((prev) =>
      prev.includes(parentId)
        ? prev.filter((id) => id !== parentId)
        : [...prev, parentId]
    );
  };

  // Filter and validate selected items when data changes
  useEffect(() => {
    if (activeTab === 'parent' && parentCategories.length > 0) {
      // Remove any selected items that no longer exist
      setSelectedItems((prev) =>
        prev.filter((id) => parentCategories.some((cat) => cat.id === id))
      );
    } else if (activeTab === 'sub' && subcategories.length > 0) {
      // Remove any selected items that no longer exist
      setSelectedItems((prev) =>
        prev.filter((id) => subcategories.some((sub) => sub.id === id))
      );
    }
  }, [parentCategories, subcategories, activeTab]);

  const filteredParentCategories = parentCategories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubcategories = subcategories.filter(
    (sub) =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.parentName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className='min-h-screen bg-background' dir='rtl'>
      <div className='container mx-auto px-4 py-6'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold mb-2'>مدیریت دسته‌بندی‌ها</h1>
          <p className='text-muted-foreground'>
            مدیریت دسته‌بندی‌ها و زیردسته‌های فروشگاه
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className='flex flex-col sm:flex-row gap-4 justify-between'>
              <div className='flex items-center gap-2'>
                <div className='relative flex-1 max-w-sm'>
                  <Search className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
                  <Input
                    placeholder='جستجو...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pr-10'
                    dir='rtl'
                  />
                </div>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={refreshData}
                  disabled={isRefreshing}>
                  <RefreshCw
                    className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
                  />
                </Button>
              </div>

              <div className='flex items-center gap-2'>
                {selectedItems.length > 0 && (
                  <>
                    <Badge variant='secondary'>
                      {new Intl.NumberFormat('fa-IR').format(
                        selectedItems.length
                      )}{' '}
                      انتخاب شده
                    </Badge>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleBulkToggle(true)}>
                      <Eye className='h-4 w-4 ml-2' />
                      فعال‌سازی
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleBulkToggle(false)}>
                      <EyeOff className='h-4 w-4 ml-2' />
                      غیرفعال‌سازی
                    </Button>
                    <Separator orientation='vertical' className='h-8' />
                  </>
                )}
                <Link to='/admin/categories/add' search={{ type: activeTab }}>
                  <Button>
                    <Plus className='h-4 w-4 ml-2' />
                    افزودن {activeTab === 'parent' ? 'دسته‌بندی' : 'زیردسته'}
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v as 'parent' | 'sub');
                setSelectedItems([]);
              }}
              dir='rtl'>
              <TabsList className='grid w-full grid-cols-2 mb-6'>
                <TabsTrigger value='parent' className='flex items-center gap-2'>
                  <FolderOpen className='h-4 w-4' />
                  دسته‌بندی‌های اصلی
                  {parentCategories.length > 0 && (
                    <Badge variant='secondary' className='mr-2'>
                      {new Intl.NumberFormat('fa-IR').format(
                        parentCategories.length
                      )}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value='sub' className='flex items-center gap-2'>
                  <Tag className='h-4 w-4' />
                  زیردسته‌ها
                  {subcategories.length > 0 && (
                    <Badge variant='secondary' className='mr-2'>
                      {new Intl.NumberFormat('fa-IR').format(
                        subcategories.length
                      )}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value='parent' dir='rtl'>
                <Await
                  promise={deferredParentCategories}
                  fallback={<TableSkeleton />}>
                  {() => (
                    <div className='rounded-md border' dir='rtl'>
                      <Table dir='rtl'>
                        <TableHeader>
                          <TableRow>
                            <TableHead className='w-12 text-right'>
                              <Checkbox
                                checked={
                                  selectedItems.length ===
                                    filteredParentCategories.length &&
                                  filteredParentCategories.length > 0
                                }
                                onCheckedChange={(checked) => {
                                  setSelectedItems(
                                    checked
                                      ? filteredParentCategories.map(
                                          (c) => c.id
                                        )
                                      : []
                                  );
                                }}
                              />
                            </TableHead>
                            <TableHead className='text-right'>نام</TableHead>
                            <TableHead className='text-right'>نامک</TableHead>
                            <TableHead className='text-right'>
                              زیردسته‌ها
                            </TableHead>
                            <TableHead className='text-right'>وضعیت</TableHead>
                            <TableHead className='text-right'>
                              تاریخ ایجاد
                            </TableHead>
                            <TableHead className='text-left'>عملیات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredParentCategories.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className='text-center py-8 text-muted-foreground'>
                                دسته‌بندی یافت نشد
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredParentCategories.map((category) => {
                              const subCount = subcategories.filter(
                                (s) => s.parentCategoryId === category.id
                              ).length;
                              const isExpanded = expandedParents.includes(
                                category.id
                              );
                              const categorySubs = subcategories.filter(
                                (s) => s.parentCategoryId === category.id
                              );

                              return (
                                <>
                                  <TableRow key={category.id}>
                                    <TableCell className='text-right'>
                                      <Checkbox
                                        checked={selectedItems.includes(
                                          category.id
                                        )}
                                        onCheckedChange={(checked) => {
                                          setSelectedItems((prev) =>
                                            checked
                                              ? [...prev, category.id]
                                              : prev.filter(
                                                  (id) => id !== category.id
                                                )
                                          );
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell className='font-medium text-right'>
                                      <div className='flex items-center gap-2'>
                                        {subCount > 0 && (
                                          <Button
                                            variant='ghost'
                                            size='icon'
                                            className='h-6 w-6'
                                            onClick={() =>
                                              toggleParentExpansion(category.id)
                                            }>
                                            {isExpanded ? (
                                              <ChevronUp className='h-4 w-4' />
                                            ) : (
                                              <ChevronDown className='h-4 w-4' />
                                            )}
                                          </Button>
                                        )}
                                        <FolderOpen className='h-4 w-4 text-muted-foreground' />
                                        {category.name}
                                      </div>
                                    </TableCell>
                                    <TableCell className='text-sm text-right'>
                                      <span dir='ltr'>{category.slug}</span>
                                    </TableCell>
                                    <TableCell className='text-right'>
                                      <Badge variant='secondary'>
                                        {new Intl.NumberFormat('fa-IR').format(
                                          subCount
                                        )}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className='text-right'>
                                      <Badge
                                        variant={
                                          category.isActive
                                            ? 'default'
                                            : 'secondary'
                                        }>
                                        {category.isActive ? 'فعال' : 'غیرفعال'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className='text-sm text-muted-foreground text-right'>
                                      {formatDate(category.createdAt)}
                                    </TableCell>
                                    <TableCell className='text-left'>
                                      <DropdownMenu dir='rtl'>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant='ghost' size='icon'>
                                            <MoreVertical className='h-4 w-4' />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align='start'>
                                          <DropdownMenuLabel>
                                            عملیات
                                          </DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem asChild>
                                            <Link
                                              to='/admin/categories/edit/$id'
                                              params={{
                                                id: category.id.toString(),
                                              }}>
                                              <Edit className='h-4 w-4 ml-2' />
                                              ویرایش
                                            </Link>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleToggleStatus(
                                                category.id,
                                                'parent'
                                              )
                                            }>
                                            {category.isActive ? (
                                              <>
                                                <ToggleLeft className='h-4 w-4 ml-2' />
                                                غیرفعال کردن
                                              </>
                                            ) : (
                                              <>
                                                <ToggleRight className='h-4 w-4 ml-2' />
                                                فعال کردن
                                              </>
                                            )}
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            className='text-destructive'
                                            onClick={() =>
                                              setDeleteDialog({
                                                open: true,
                                                id: category.id,
                                                type: 'parent',
                                                name: category.name,
                                              })
                                            }
                                            disabled={subCount > 0}>
                                            <Trash2 className='h-4 w-4 ml-2' />
                                            حذف{' '}
                                            {subCount > 0 &&
                                              `(${new Intl.NumberFormat('fa-IR').format(subCount)} زیردسته)`}
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                  {isExpanded &&
                                    categorySubs.map((sub) => (
                                      <TableRow
                                        key={`sub-${sub.id}`}
                                        className='bg-muted/30'>
                                        <TableCell></TableCell>
                                        <TableCell className='pr-12 text-right'>
                                          <div className='flex items-center gap-2'>
                                            <Tag className='h-3 w-3 text-muted-foreground' />
                                            {sub.name}
                                          </div>
                                        </TableCell>
                                        <TableCell className='text-sm text-right'>
                                          <span dir='ltr'>{sub.slug}</span>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell className='text-right'>
                                          <Badge
                                            variant={
                                              sub.isActive
                                                ? 'default'
                                                : 'secondary'
                                            }
                                            className='text-xs'>
                                            {sub.isActive ? 'فعال' : 'غیرفعال'}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className='text-sm text-muted-foreground text-right'>
                                          {formatDate(sub.createdAt)}
                                        </TableCell>
                                        <TableCell className='text-left'>
                                          <Link
                                            to='/admin/categories/edit/$id'
                                            params={{ id: sub.id.toString() }}>
                                            <Button variant='ghost' size='sm'>
                                              ویرایش
                                            </Button>
                                          </Link>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Await>
              </TabsContent>

              <TabsContent value='sub' dir='rtl'>
                <Await
                  promise={deferredSubcategories}
                  fallback={<TableSkeleton />}>
                  {() => (
                    <div className='rounded-md border' dir='rtl'>
                      <Table dir='rtl'>
                        <TableHeader>
                          <TableRow>
                            <TableHead className='w-12 text-right'>
                              <Checkbox
                                checked={
                                  selectedItems.length ===
                                    filteredSubcategories.length &&
                                  filteredSubcategories.length > 0
                                }
                                onCheckedChange={(checked) => {
                                  setSelectedItems(
                                    checked
                                      ? filteredSubcategories.map((s) => s.id)
                                      : []
                                  );
                                }}
                              />
                            </TableHead>
                            <TableHead className='text-right'>نام</TableHead>
                            <TableHead className='text-right'>نامک</TableHead>
                            <TableHead className='text-right'>
                              دسته والد
                            </TableHead>
                            <TableHead className='text-right'>وضعیت</TableHead>
                            <TableHead className='text-right'>
                              تاریخ ایجاد
                            </TableHead>
                            <TableHead className='text-left'>عملیات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSubcategories.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className='text-center py-8 text-muted-foreground'>
                                زیردسته‌ای یافت نشد
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredSubcategories.map((sub) => (
                              <TableRow key={sub.id}>
                                <TableCell className='text-right'>
                                  <Checkbox
                                    checked={selectedItems.includes(sub.id)}
                                    onCheckedChange={(checked) => {
                                      setSelectedItems((prev) =>
                                        checked
                                          ? [...prev, sub.id]
                                          : prev.filter((id) => id !== sub.id)
                                      );
                                    }}
                                  />
                                </TableCell>
                                <TableCell className='font-medium text-right'>
                                  <div className='flex items-center gap-2'>
                                    <Tag className='h-4 w-4 text-muted-foreground' />
                                    {sub.name}
                                  </div>
                                </TableCell>
                                <TableCell className='text-sm text-right'>
                                  <span dir='ltr'>{sub.slug}</span>
                                </TableCell>
                                <TableCell className='text-right'>
                                  <Badge variant='outline'>
                                    {sub.parentName}
                                  </Badge>
                                </TableCell>
                                <TableCell className='text-right'>
                                  <Badge
                                    variant={
                                      sub.isActive ? 'default' : 'secondary'
                                    }>
                                    {sub.isActive ? 'فعال' : 'غیرفعال'}
                                  </Badge>
                                </TableCell>
                                <TableCell className='text-sm text-muted-foreground text-right'>
                                  {formatDate(sub.createdAt)}
                                </TableCell>
                                <TableCell className='text-left'>
                                  <DropdownMenu dir='rtl'>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant='ghost' size='icon'>
                                        <MoreVertical className='h-4 w-4' />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align='start'>
                                      <DropdownMenuLabel>
                                        عملیات
                                      </DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem asChild>
                                        <Link
                                          to='/admin/categories/edit/$id'
                                          params={{ id: sub.id.toString() }}>
                                          <Edit className='h-4 w-4 ml-2' />
                                          ویرایش
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleToggleStatus(sub.id, 'sub')
                                        }>
                                        {sub.isActive ? (
                                          <>
                                            <ToggleLeft className='h-4 w-4 ml-2' />
                                            غیرفعال کردن
                                          </>
                                        ) : (
                                          <>
                                            <ToggleRight className='h-4 w-4 ml-2' />
                                            فعال کردن
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className='text-destructive'
                                        onClick={() =>
                                          setDeleteDialog({
                                            open: true,
                                            id: sub.id,
                                            type: 'sub',
                                            name: sub.name,
                                          })
                                        }>
                                        <Trash2 className='h-4 w-4 ml-2' />
                                        حذف
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Await>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Dialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open })}>
          <DialogContent dir='rtl'>
            <DialogHeader>
              <DialogTitle>تایید حذف</DialogTitle>
              <DialogDescription>
                آیا از حذف{' '}
                {deleteDialog.type === 'parent' ? 'دسته‌بندی' : 'زیردسته'} "
                {deleteDialog.name}" اطمینان دارید؟ این عملیات قابل بازگشت نیست.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                variant='outline'
                onClick={() => setDeleteDialog({ open: false })}
                disabled={isDeleting}>
                انصراف
              </Button>
              <Button
                variant='destructive'
                onClick={handleDelete}
                disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className='ml-2 h-4 w-4 animate-spin' />
                    در حال حذف...
                  </>
                ) : (
                  <>
                    <Trash2 className='ml-2 h-4 w-4' />
                    حذف
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
