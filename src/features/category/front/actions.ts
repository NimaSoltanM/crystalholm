import { createServerFn } from '@tanstack/react-start';
import { drizzle } from 'drizzle-orm/node-postgres';
import {
  eq,
  and,
  ilike,
  desc,
  asc,
  count,
  ne,
  sql,
  inArray,
} from 'drizzle-orm';
import { parentCategories, subcategories } from '@/server/db/schema';
import type { NewParentCategory, NewSubcategory } from '@/server/db/schema';

const db = drizzle(process.env.DATABASE_URL!);

// ============ PARENT CATEGORY ACTIONS ============

// Create parent category
export const createParentCategory = createServerFn({
  method: 'POST',
})
  .validator(
    (data: {
      name: string;
      slug: string;
      description?: string;
      isActive?: boolean;
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      // Check if slug already exists
      const existing = await db
        .select()
        .from(parentCategories)
        .where(eq(parentCategories.slug, data.slug))
        .limit(1);

      if (existing.length > 0) {
        throw new Error('این نامک قبلاً استفاده شده است');
      }

      const [newCategory] = await db
        .insert(parentCategories)
        .values({
          name: data.name,
          slug: data.slug.toLowerCase().trim(),
          description: data.description,
          isActive: data.isActive ?? true,
        })
        .returning();

      return { success: true, data: newCategory };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در ایجاد دسته‌بندی',
      };
    }
  });

// Update parent category
export const updateParentCategory = createServerFn({
  method: 'POST',
})
  .validator(
    (data: {
      id: number;
      name?: string;
      slug?: string;
      description?: string;
      isActive?: boolean;
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      // If slug is being updated, check for duplicates
      if (data.slug) {
        const existing = await db
          .select()
          .from(parentCategories)
          .where(
            and(
              eq(parentCategories.slug, data.slug),
              ne(parentCategories.id, data.id)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          throw new Error('این نامک قبلاً استفاده شده است');
        }
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.slug !== undefined)
        updateData.slug = data.slug.toLowerCase().trim();
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const [updated] = await db
        .update(parentCategories)
        .set(updateData)
        .where(eq(parentCategories.id, data.id))
        .returning();

      if (!updated) {
        throw new Error('دسته‌بندی یافت نشد');
      }

      return { success: true, data: updated };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در به‌روزرسانی دسته‌بندی',
      };
    }
  });

// Delete parent category
export const deleteParentCategory = createServerFn({
  method: 'POST',
})
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    try {
      // Check if category has subcategories
      const [subCount] = await db
        .select({ count: count() })
        .from(subcategories)
        .where(eq(subcategories.parentCategoryId, id));

      if (subCount.count > 0) {
        throw new Error('این دسته دارای زیردسته است و قابل حذف نیست');
      }

      const [deleted] = await db
        .delete(parentCategories)
        .where(eq(parentCategories.id, id))
        .returning();

      if (!deleted) {
        throw new Error('دسته‌بندی یافت نشد');
      }

      return { success: true, data: deleted };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در حذف دسته‌بندی',
      };
    }
  });

// Toggle parent category active status
export const toggleParentCategoryStatus = createServerFn({
  method: 'POST',
})
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    try {
      const [current] = await db
        .select()
        .from(parentCategories)
        .where(eq(parentCategories.id, id))
        .limit(1);

      if (!current) {
        throw new Error('دسته‌بندی یافت نشد');
      }

      const [updated] = await db
        .update(parentCategories)
        .set({
          isActive: !current.isActive,
          updatedAt: new Date(),
        })
        .where(eq(parentCategories.id, id))
        .returning();

      return { success: true, data: updated };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در تغییر وضعیت',
      };
    }
  });

// ============ SUBCATEGORY ACTIONS ============

// Create subcategory
export const createSubcategory = createServerFn({
  method: 'POST',
})
  .validator(
    (data: {
      name: string;
      slug: string;
      parentCategoryId: number;
      description?: string;
      isActive?: boolean;
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      // Check if parent exists
      const [parent] = await db
        .select()
        .from(parentCategories)
        .where(eq(parentCategories.id, data.parentCategoryId))
        .limit(1);

      if (!parent) {
        throw new Error('دسته‌بندی والد یافت نشد');
      }

      // Check if slug already exists within the same parent
      const existing = await db
        .select()
        .from(subcategories)
        .where(
          and(
            eq(subcategories.slug, data.slug),
            eq(subcategories.parentCategoryId, data.parentCategoryId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error('این نامک در این دسته قبلاً استفاده شده است');
      }

      const [newSubcategory] = await db
        .insert(subcategories)
        .values({
          name: data.name,
          slug: data.slug.toLowerCase().trim(),
          parentCategoryId: data.parentCategoryId,
          description: data.description,
          isActive: data.isActive ?? true,
        })
        .returning();

      return { success: true, data: newSubcategory };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در ایجاد زیردسته',
      };
    }
  });

// Update subcategory
export const updateSubcategory = createServerFn({
  method: 'POST',
})
  .validator(
    (data: {
      id: number;
      name?: string;
      slug?: string;
      parentCategoryId?: number;
      description?: string;
      isActive?: boolean;
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      // Get current subcategory
      const [current] = await db
        .select()
        .from(subcategories)
        .where(eq(subcategories.id, data.id))
        .limit(1);

      if (!current) {
        throw new Error('زیردسته یافت نشد');
      }

      const parentId = data.parentCategoryId || current.parentCategoryId;

      // If slug is being updated, check for duplicates
      if (data.slug) {
        const existing = await db
          .select()
          .from(subcategories)
          .where(
            and(
              eq(subcategories.slug, data.slug),
              eq(subcategories.parentCategoryId, parentId),
              ne(subcategories.id, data.id)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          throw new Error('این نامک در این دسته قبلاً استفاده شده است');
        }
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.slug !== undefined)
        updateData.slug = data.slug.toLowerCase().trim();
      if (data.parentCategoryId !== undefined)
        updateData.parentCategoryId = data.parentCategoryId;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const [updated] = await db
        .update(subcategories)
        .set(updateData)
        .where(eq(subcategories.id, data.id))
        .returning();

      return { success: true, data: updated };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در به‌روزرسانی زیردسته',
      };
    }
  });

// Delete subcategory
export const deleteSubcategory = createServerFn({
  method: 'POST',
})
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    try {
      // Check if subcategory has products
      const { products } = await import('@/server/db/schema');
      const [productCount] = await db
        .select({ count: count() })
        .from(products)
        .where(eq(products.subcategoryId, id));

      if (productCount.count > 0) {
        throw new Error('این زیردسته دارای محصول است و قابل حذف نیست');
      }

      const [deleted] = await db
        .delete(subcategories)
        .where(eq(subcategories.id, id))
        .returning();

      if (!deleted) {
        throw new Error('زیردسته یافت نشد');
      }

      return { success: true, data: deleted };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در حذف زیردسته',
      };
    }
  });

// Toggle subcategory active status
export const toggleSubcategoryStatus = createServerFn({
  method: 'POST',
})
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    try {
      const [current] = await db
        .select()
        .from(subcategories)
        .where(eq(subcategories.id, id))
        .limit(1);

      if (!current) {
        throw new Error('زیردسته یافت نشد');
      }

      const [updated] = await db
        .update(subcategories)
        .set({
          isActive: !current.isActive,
          updatedAt: new Date(),
        })
        .where(eq(subcategories.id, id))
        .returning();

      return { success: true, data: updated };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در تغییر وضعیت',
      };
    }
  });

// Move subcategory to different parent
export const moveSubcategory = createServerFn({
  method: 'POST',
})
  .validator((data: { subcategoryId: number; newParentId: number }) => data)
  .handler(async ({ data }) => {
    try {
      // Check if new parent exists
      const [parent] = await db
        .select()
        .from(parentCategories)
        .where(eq(parentCategories.id, data.newParentId))
        .limit(1);

      if (!parent) {
        throw new Error('دسته‌بندی والد جدید یافت نشد');
      }

      // Get current subcategory
      const [current] = await db
        .select()
        .from(subcategories)
        .where(eq(subcategories.id, data.subcategoryId))
        .limit(1);

      if (!current) {
        throw new Error('زیردسته یافت نشد');
      }

      // Check if slug exists in new parent
      const existing = await db
        .select()
        .from(subcategories)
        .where(
          and(
            eq(subcategories.slug, current.slug),
            eq(subcategories.parentCategoryId, data.newParentId),
            ne(subcategories.id, data.subcategoryId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error('این نامک در دسته‌ی مقصد وجود دارد');
      }

      const [updated] = await db
        .update(subcategories)
        .set({
          parentCategoryId: data.newParentId,
          updatedAt: new Date(),
        })
        .where(eq(subcategories.id, data.subcategoryId))
        .returning();

      return { success: true, data: updated };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در انتقال زیردسته',
      };
    }
  });

// Bulk toggle status
export const bulkToggleCategoryStatus = createServerFn({
  method: 'POST',
})
  .validator(
    (data: { type: 'parent' | 'sub'; ids: number[]; isActive: boolean }) => data
  )
  .handler(async ({ data }) => {
    try {
      if (data.ids.length === 0) {
        throw new Error('هیچ آیتمی انتخاب نشده است');
      }

      if (data.type === 'parent') {
        const updated = await db
          .update(parentCategories)
          .set({
            isActive: data.isActive,
            updatedAt: new Date(),
          })
          .where(inArray(parentCategories.id, data.ids))
          .returning();

        return {
          success: true,
          data: updated,
          message: `${updated.length} مورد به‌روزرسانی شد`,
        };
      } else {
        const updated = await db
          .update(subcategories)
          .set({
            isActive: data.isActive,
            updatedAt: new Date(),
          })
          .where(inArray(subcategories.id, data.ids))
          .returning();

        return {
          success: true,
          data: updated,
          message: `${updated.length} مورد به‌روزرسانی شد`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'خطا در به‌روزرسانی گروهی',
      };
    }
  });

// Generate slug from name
export const generateSlug = createServerFn({
  method: 'POST',
})
  .validator((name: string) => name)
  .handler(async ({ data: name }) => {
    // Convert Persian/Arabic numbers to English
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

    let slug = name.toLowerCase();

    // Replace Persian/Arabic numbers with English
    persianNumbers.forEach((num, index) => {
      slug = slug.replace(new RegExp(num, 'g'), index.toString());
    });
    arabicNumbers.forEach((num, index) => {
      slug = slug.replace(new RegExp(num, 'g'), index.toString());
    });

    // Replace spaces and special characters
    slug = slug
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0600-\u06FF\-]/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');

    return { success: true, slug };
  });
