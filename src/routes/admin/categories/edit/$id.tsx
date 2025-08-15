import { CategoryManagementForm } from '@/features/category/front/components/category-form';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import {
  getParentCategoryById,
  getSubcategoryById,
} from '@/features/category/front/fetchers';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/categories/edit/$id')({
  loader: async ({ params }) => {
    const id = parseInt(params.id);

    // Try to fetch as parent category first
    try {
      const parentCategory = await getParentCategoryById({ data: id });
      return {
        type: 'parent' as const,
        data: {
          id: parentCategory.id,
          name: parentCategory.name,
          slug: parentCategory.slug,
          description: parentCategory.description || undefined,
          isActive: parentCategory.isActive,
        },
      };
    } catch {
      // If not found as parent, try as subcategory
      try {
        const subcategory = await getSubcategoryById({ data: id });
        return {
          type: 'sub' as const,
          data: {
            id: subcategory.id,
            name: subcategory.name,
            slug: subcategory.slug,
            description: subcategory.description || undefined,
            isActive: subcategory.isActive,
            parentCategoryId: subcategory.parentCategoryId,
          },
        };
      } catch {
        throw new Error('دسته‌بندی یافت نشد');
      }
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const { type, data } = Route.useLoaderData();

  return (
    <CategoryManagementForm
      mode='edit'
      type={type}
      initialData={data}
      onSuccess={() => {
        toast.success('دسته‌بندی با موفقیت به‌روزرسانی شد');
        router.navigate({ to: '/admin/categories' });
      }}
      onCancel={() => {
        router.navigate({ to: '/admin/categories' });
      }}
    />
  );
}
