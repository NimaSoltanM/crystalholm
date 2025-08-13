import { getCurrentUser } from '@/features/auth/actions';
import { getParentCategories } from '@/features/category/front/fetchers';
import { BottomNavigation } from '@/features/ui/navbar/components/bottom-navigation';
import Navbar from '@/features/ui/navbar/components/navbar';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/(landing)')({
  loader: async () => {
    const [user, parentCategories] = await Promise.all([
      getCurrentUser(),
      getParentCategories(),
    ]);
    return { user, parentCategories };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { user, parentCategories } = Route.useLoaderData();

  return (
    <>
      <Navbar user={user} parentCategories={parentCategories} />
      <Outlet />
      <BottomNavigation />
    </>
  );
}
