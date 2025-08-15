import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  createParentCategory,
  updateParentCategory,
  createSubcategory,
  updateSubcategory,
  generateSlug,
} from '../actions';
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Wand2,
  FolderOpen,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getParentCategories } from '../fetchers';

interface CategoryFormProps {
  mode: 'create' | 'edit';
  type?: 'parent' | 'sub';
  initialData?: {
    id?: number;
    name?: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
    parentCategoryId?: number;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoryManagementForm({
  mode = 'create',
  type: initialType = 'parent',
  initialData,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const navigate = useNavigate();
  const [type, setType] = useState<'parent' | 'sub'>(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [isLoadingParents, setIsLoadingParents] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    isActive: initialData?.isActive ?? true,
    parentCategoryId: initialData?.parentCategoryId || 0,
  });

  const [touched, setTouched] = useState({
    name: false,
    slug: false,
    parentCategoryId: false,
  });

  useEffect(() => {
    if (type === 'sub' || (mode === 'edit' && initialData?.parentCategoryId)) {
      loadParentCategories();
    }
  }, [type, mode]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        isActive: initialData.isActive ?? true,
        parentCategoryId: initialData.parentCategoryId || 0,
      });
      if (initialData.parentCategoryId) {
        setType('sub');
      }
    }
  }, [initialData]);

  const loadParentCategories = async () => {
    setIsLoadingParents(true);
    try {
      const result = await getParentCategories();
      if (Array.isArray(result)) {
        setParentCategories(result);
      }
    } catch (error) {
      console.error('Failed to load parent categories:', error);
    } finally {
      setIsLoadingParents(false);
    }
  };

  const handleGenerateSlug = async () => {
    if (!formData.name) {
      setError('لطفاً ابتدا نام را وارد کنید');
      return;
    }

    try {
      const result = await generateSlug({ data: formData.name });
      if (result.success && result.slug) {
        setFormData((prev) => ({ ...prev, slug: result.slug }));
        setTouched((prev) => ({ ...prev, slug: true }));
      }
    } catch (error) {
      setError('خطا در تولید نامک');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('نام الزامی است');
      return false;
    }
    if (!formData.slug.trim()) {
      setError('نامک الزامی است');
      return false;
    }
    if (type === 'sub' && !formData.parentCategoryId) {
      setError('دسته‌بندی والد الزامی است');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      let result;

      if (mode === 'create') {
        if (type === 'parent') {
          result = await createParentCategory({
            data: {
              name: formData.name,
              slug: formData.slug,
              description: formData.description,
              isActive: formData.isActive,
            },
          });
        } else {
          result = await createSubcategory({
            data: {
              name: formData.name,
              slug: formData.slug,
              description: formData.description,
              parentCategoryId: formData.parentCategoryId,
              isActive: formData.isActive,
            },
          });
        }
      } else {
        if (type === 'parent') {
          result = await updateParentCategory({
            data: {
              id: initialData!.id!,
              name: formData.name,
              slug: formData.slug,
              description: formData.description,
              isActive: formData.isActive,
            },
          });
        } else {
          result = await updateSubcategory({
            data: {
              id: initialData!.id!,
              name: formData.name,
              slug: formData.slug,
              description: formData.description,
              parentCategoryId: formData.parentCategoryId,
              isActive: formData.isActive,
            },
          });
        }
      }

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            navigate({ to: '/admin/categories' });
          }
        }, 1500);
      } else {
        setError(result.error || 'خطا در ذخیره دسته‌بندی');
      }
    } catch (error: any) {
      setError(error.message || 'خطای غیرمنتظره');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (error) setError(null);
  };

  return (
    <div className='min-h-screen bg-background' dir='rtl'>
      <div className='container mx-auto px-4 py-6 max-w-4xl'>
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                {type === 'parent' ? (
                  <FolderOpen className='h-5 w-5 text-primary' />
                ) : (
                  <Tag className='h-5 w-5 text-primary' />
                )}
                <CardTitle>
                  {mode === 'create' ? 'ایجاد' : 'ویرایش'}{' '}
                  {type === 'parent' ? 'دسته‌بندی' : 'زیردسته'}
                </CardTitle>
              </div>
              {onCancel && (
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={onCancel}
                  className='rounded-full'>
                  <X className='h-4 w-4' />
                </Button>
              )}
            </div>
            <CardDescription>
              {mode === 'create'
                ? `یک ${type === 'parent' ? 'دسته‌بندی' : 'زیردسته'} جدید ایجاد کنید`
                : `اطلاعات ${type === 'parent' ? 'دسته‌بندی' : 'زیردسته'} را ویرایش کنید`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {mode === 'create' && !initialData?.parentCategoryId && (
              <>
                <Tabs
                  value={type}
                  onValueChange={(v) => setType(v as 'parent' | 'sub')}>
                  <TabsList className='grid w-full grid-cols-2 mb-6'>
                    <TabsTrigger value='parent'>دسته‌بندی اصلی</TabsTrigger>
                    <TabsTrigger value='sub'>زیردسته</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Separator className='mb-6' />
              </>
            )}

            {error && (
              <Alert variant='destructive' className='mb-6'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className='mb-6 border-green-200 bg-green-50'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <AlertDescription className='text-green-800'>
                  {type === 'parent' ? 'دسته‌بندی' : 'زیردسته'} با موفقیت{' '}
                  {mode === 'create' ? 'ایجاد' : 'به‌روزرسانی'} شد
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className='space-y-6'>
              {type === 'sub' && (
                <div className='space-y-2'>
                  <Label htmlFor='parentCategory'>
                    دسته‌بندی والد
                    <span className='text-destructive mr-1'>*</span>
                  </Label>
                  <Select
                    value={formData.parentCategoryId.toString()}
                    onValueChange={(value) =>
                      handleInputChange('parentCategoryId', parseInt(value))
                    }
                    disabled={isLoadingParents}>
                    <SelectTrigger
                      id='parentCategory'
                      className={cn(
                        touched.parentCategoryId &&
                          !formData.parentCategoryId &&
                          'border-destructive'
                      )}>
                      <SelectValue placeholder='انتخاب دسته‌بندی والد' />
                    </SelectTrigger>
                    <SelectContent dir='rtl'>
                      {parentCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>
                    نام
                    <span className='text-destructive mr-1'>*</span>
                  </Label>
                  <Input
                    id='name'
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={
                      type === 'parent' ? 'مثال: الکترونیک' : 'مثال: موبایل'
                    }
                    className={cn(
                      touched.name && !formData.name && 'border-destructive'
                    )}
                    dir='rtl'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='slug'>
                    نامک (URL)
                    <span className='text-destructive mr-1'>*</span>
                  </Label>
                  <div className='flex gap-2'>
                    <Input
                      id='slug'
                      value={formData.slug}
                      onChange={(e) =>
                        handleInputChange('slug', e.target.value)
                      }
                      placeholder='electronics'
                      className={cn(
                        'flex-1',
                        touched.slug && !formData.slug && 'border-destructive'
                      )}
                      dir='ltr'
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type='button'
                            variant='outline'
                            size='icon'
                            onClick={handleGenerateSlug}
                            disabled={!formData.name}>
                            <Wand2 className='h-4 w-4' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>تولید خودکار نامک</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description'>توضیحات</Label>
                <Textarea
                  id='description'
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder='توضیحات اختیاری...'
                  rows={4}
                  className='resize-none'
                  dir='rtl'
                />
              </div>

              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <Label htmlFor='isActive'>وضعیت</Label>
                  <p className='text-sm text-muted-foreground'>
                    {formData.isActive
                      ? 'دسته‌بندی فعال است'
                      : 'دسته‌بندی غیرفعال است'}
                  </p>
                </div>
                <Switch
                  id='isActive'
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    handleInputChange('isActive', checked)
                  }
                />
              </div>

              <Separator />

              <div className='flex items-center justify-end gap-3'>
                {onCancel && (
                  <Button
                    type='button'
                    variant='outline'
                    onClick={onCancel}
                    disabled={isSubmitting}>
                    انصراف
                  </Button>
                )}
                <Button
                  type='submit'
                  disabled={isSubmitting || success}
                  className='min-w-[120px]'>
                  {isSubmitting ? (
                    <>
                      <Loader2 className='ml-2 h-4 w-4 animate-spin' />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Save className='ml-2 h-4 w-4' />
                      {mode === 'create' ? 'ایجاد' : 'به‌روزرسانی'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
