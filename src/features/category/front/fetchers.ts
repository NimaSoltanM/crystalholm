import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, asc } from 'drizzle-orm';
import { parentCategories, subcategories } from '@/server/db/schema';
import { createServerFn } from '@tanstack/react-start';
import db from '@/server/db';

// Get all parent categories
export const getParentCategories = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await db
    .select()
    .from(parentCategories)
    .where(eq(parentCategories.isActive, true))
    .orderBy(asc(parentCategories.name));
});

// Get subcategories by parent category ID
export const getSubcategories = createServerFn({
  method: 'GET',
})
  .validator((parentCategoryId: number) => parentCategoryId)
  .handler(async ({ data: parentCategoryId }) => {
    return await db
      .select()
      .from(subcategories)
      .where(
        and(
          eq(subcategories.parentCategoryId, parentCategoryId),
          eq(subcategories.isActive, true)
        )
      )
      .orderBy(asc(subcategories.name));
  });

// Get category breadcrumb (parent -> sub)
export const getCategoryBreadcrumb = createServerFn({
  method: 'GET',
})
  .validator((subcategoryId: number) => subcategoryId)
  .handler(async ({ data: subcategoryId }) => {
    const result = await db
      .select({
        parentName: parentCategories.name,
        parentSlug: parentCategories.slug,
        subcategoryName: subcategories.name,
        subcategorySlug: subcategories.slug,
      })
      .from(subcategories)
      .innerJoin(
        parentCategories,
        eq(subcategories.parentCategoryId, parentCategories.id)
      )
      .where(eq(subcategories.id, subcategoryId))
      .limit(1);

    return result[0];
  });

// Get single parent category by slug
export const getParentCategory = createServerFn({
  method: 'GET',
})
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const category = await db
      .select()
      .from(parentCategories)
      .where(
        and(
          eq(parentCategories.slug, slug),
          eq(parentCategories.isActive, true)
        )
      )
      .limit(1);

    if (!category[0]) {
      throw new Error('دسته‌بندی یافت نشد');
    }

    return category[0];
  });

// Get single subcategory by slug
export const getSubcategory = createServerFn({
  method: 'GET',
})
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const subcategory = await db
      .select()
      .from(subcategories)
      .where(
        and(eq(subcategories.slug, slug), eq(subcategories.isActive, true))
      )
      .limit(1);

    if (!subcategory[0]) {
      throw new Error('زیردسته یافت نشد');
    }

    return subcategory[0];
  });

// Get ALL parent categories for admin (including inactive)
export const getAllParentCategoriesAdmin = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await db
    .select()
    .from(parentCategories)
    .orderBy(asc(parentCategories.name));
});

// Get ALL subcategories with parent info for admin
export const getAllSubcategoriesAdmin = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await db
    .select({
      id: subcategories.id,
      name: subcategories.name,
      slug: subcategories.slug,
      description: subcategories.description,
      isActive: subcategories.isActive,
      parentCategoryId: subcategories.parentCategoryId,
      parentName: parentCategories.name,
      createdAt: subcategories.createdAt,
      updatedAt: subcategories.updatedAt,
    })
    .from(subcategories)
    .leftJoin(
      parentCategories,
      eq(subcategories.parentCategoryId, parentCategories.id)
    )
    .orderBy(asc(parentCategories.name), asc(subcategories.name));
});

// Get parent category by ID for editing
export const getParentCategoryById = createServerFn({
  method: 'GET',
})
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    const [category] = await db
      .select()
      .from(parentCategories)
      .where(eq(parentCategories.id, id))
      .limit(1);

    if (!category) {
      throw new Error('دسته‌بندی یافت نشد');
    }

    return category;
  });

// Get subcategory by ID for editing
export const getSubcategoryById = createServerFn({
  method: 'GET',
})
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    const [subcategory] = await db
      .select()
      .from(subcategories)
      .where(eq(subcategories.id, id))
      .limit(1);

    if (!subcategory) {
      throw new Error('زیردسته یافت نشد');
    }

    return subcategory;
  });
