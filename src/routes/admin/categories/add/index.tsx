import { CategoryManagementForm } from '@/features/category/front/components/category-form';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/categories/add/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <CategoryManagementForm mode='create' />;
}
