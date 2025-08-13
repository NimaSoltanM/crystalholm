import type { InferSelectModel } from 'drizzle-orm';
import { users, parentCategories, subcategories } from '@/server/db/schema';

export type NavbarUser = InferSelectModel<typeof users> | null;
export type NavbarSubcategory = InferSelectModel<typeof subcategories>;
export type NavbarParentCategory = InferSelectModel<typeof parentCategories> & {
  subcategories?: NavbarSubcategory[];
};

export interface BaseNavbarProps {
  user: NavbarUser;
  cartItemsCount?: number;
  onSearch?: (query: string) => void;
  onLogin?: () => void;
  onLogout?: () => void;
}
