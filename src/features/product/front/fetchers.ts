import { createServerFn } from '@tanstack/react-start';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, ilike, desc, asc, count, inArray } from 'drizzle-orm';
import { optionGroups, options, products } from '@/server/db/schema';

const db = drizzle(process.env.DATABASE_URL!);

// Get products with pagination and filtering
export const getProducts = createServerFn({
  method: 'GET',
})
  .validator(
    (params: {
      subcategoryId: number;
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: 'name' | 'price' | 'newest';
      sortOrder?: 'asc' | 'desc';
    }) => params
  )
  .handler(async ({ data }) => {
    const {
      subcategoryId,
      page = 1,
      limit = 12,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = data;

    const offset = (page - 1) * limit;

    // Base conditions
    const conditions = [
      eq(products.subcategoryId, subcategoryId),
      eq(products.isActive, true),
    ];

    // Add search filter
    if (search) {
      conditions.push(ilike(products.name, `%${search}%`));
    }

    // Determine sort column and order
    const sortColumn =
      sortBy === 'price'
        ? products.basePrice
        : sortBy === 'newest'
          ? products.createdAt
          : products.name;

    const sortFn = sortOrder === 'desc' ? desc : asc;

    // Get products with pagination
    const productList = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        imageUrl: products.imageUrl,
        basePrice: products.basePrice,
        sku: products.sku,
        createdAt: products.createdAt,
      })
      .from(products)
      .where(and(...conditions))
      .orderBy(sortFn(sortColumn))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(products)
      .where(and(...conditions));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      products: productList,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  });

// Get single product by slug
export const getProduct = createServerFn({
  method: 'GET',
})
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const product = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.isActive, true)))
      .limit(1);

    if (!product[0]) {
      throw new Error('محصول یافت نشد');
    }

    return product[0];
  });

export const getProductOptions = createServerFn({
  method: 'GET',
})
  .validator((productId: number) => productId)
  .handler(async ({ data: productId }) => {
    // Get option groups for the product
    const groups = await db
      .select()
      .from(optionGroups)
      .where(eq(optionGroups.productId, productId))
      .orderBy(asc(optionGroups.name));

    // Get all options for these groups
    const groupIds = groups.map((g) => g.id);

    if (groupIds.length === 0) {
      return [];
    }

    const allOptions = await db
      .select()
      .from(options)
      .where(
        and(
          eq(options.isAvailable, true),
          inArray(options.optionGroupId, groupIds) // <-- Fixed: use inArray
        )
      )
      .orderBy(asc(options.name));

    // Group options by their option group
    const groupedOptions = groups.map((group) => ({
      ...group,
      options: allOptions.filter((option) => option.optionGroupId === group.id),
    }));

    return groupedOptions;
  });
// Get featured/latest products (for homepage)
export const getFeaturedProducts = createServerFn({
  method: 'GET',
})
  .validator((limit: number = 8) => limit)
  .handler(async ({ data: limit }) => {
    return await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        imageUrl: products.imageUrl,
        basePrice: products.basePrice,
      })
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt))
      .limit(limit);
  });

// Search products across all categories
export const searchProducts = createServerFn({
  method: 'GET',
})
  .validator(
    (params: { query: string; page?: number; limit?: number }) => params
  )
  .handler(async ({ data }) => {
    const { query, page = 1, limit = 12 } = data;
    const offset = (page - 1) * limit;

    if (!query.trim()) {
      return {
        products: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    const conditions = [
      eq(products.isActive, true),
      ilike(products.name, `%${query}%`),
    ];

    // Get products
    const productList = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        imageUrl: products.imageUrl,
        basePrice: products.basePrice,
        description: products.description,
      })
      .from(products)
      .where(and(...conditions))
      .orderBy(asc(products.name))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(products)
      .where(and(...conditions));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      products: productList,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  });
