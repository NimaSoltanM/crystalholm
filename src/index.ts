import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { parentCategories, subcategories } from './server/db/schema';
import { optionGroups, options, products } from './server/db/schemas/product';

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  console.log('شروع درج داده‌ها...');

  // 1. درج دسته‌بندی اصلی
  const [electronicsCategory] = await db
    .insert(parentCategories)
    .values({
      name: 'الکترونیک',
      slug: 'electronics',
      description: 'محصولات الکترونیکی',
    })
    .returning();

  const [clothingCategory] = await db
    .insert(parentCategories)
    .values({
      name: 'پوشاک',
      slug: 'clothing',
      description: 'لباس و پوشاک',
    })
    .returning();

  // 2. درج زیردسته‌ها
  const [laptopSubcat] = await db
    .insert(subcategories)
    .values({
      name: 'لپ‌تاپ',
      slug: 'laptop',
      parentCategoryId: electronicsCategory.id,
      description: 'لپ‌تاپ و کامپیوتر همراه',
    })
    .returning();

  const [tshirtSubcat] = await db
    .insert(subcategories)
    .values({
      name: 'تی‌شرت',
      slug: 'tshirt',
      parentCategoryId: clothingCategory.id,
      description: 'تی‌شرت مردانه و زنانه',
    })
    .returning();

  // 3. درج محصولات لپ‌تاپ
  const [macbook] = await db
    .insert(products)
    .values({
      name: 'مک‌بوک پرو ۱۴ اینچ',
      slug: 'macbook-pro-14',
      description: 'لپ‌تاپ حرفه‌ای اپل',
      imageUrl: '/images/macbook-pro-14.jpg',
      sku: 'MBP-14-2024',
      basePrice: 250000000, // 25,000,000 تومان در ریال
      subcategoryId: laptopSubcat.id,
    })
    .returning();

  const [dellLaptop] = await db
    .insert(products)
    .values({
      name: 'دل ایکس‌پی‌اس ۱۳',
      slug: 'dell-xps-13',
      description: 'لپ‌تاپ ظریف و قدرتمند',
      imageUrl: '/images/dell-xps-13.jpg',
      sku: 'DELL-XPS-13',
      basePrice: 180000000, // 18,000,000 تومان در ریال
      subcategoryId: laptopSubcat.id,
    })
    .returning();

  // 4. درج محصولات تی‌شرت
  const [cottonTshirt] = await db
    .insert(products)
    .values({
      name: 'تی‌شرت نخی مردانه',
      slug: 'cotton-tshirt-men',
      description: 'تی‌شرت ۱۰۰٪ پنبه',
      imageUrl: '/images/cotton-tshirt.jpg',
      sku: 'TSHIRT-COT-M',
      basePrice: 1200000, // 120,000 تومان در ریال
      subcategoryId: tshirtSubcat.id,
    })
    .returning();

  const [premiumTshirt] = await db
    .insert(products)
    .values({
      name: 'تی‌شرت پرمیوم زنانه',
      slug: 'premium-tshirt-women',
      description: 'تی‌شرت با کیفیت بالا',
      imageUrl: '/images/premium-tshirt.jpg',
      sku: 'TSHIRT-PREM-W',
      basePrice: 1800000, // 180,000 تومان در ریال
      subcategoryId: tshirtSubcat.id,
    })
    .returning();

  console.log('محصولات درج شدند!');

  // 5. درج گروه‌های گزینه برای لپ‌تاپ مک‌بوک
  const [ramGroup] = await db
    .insert(optionGroups)
    .values({
      name: 'حافظه RAM',
      productId: macbook.id,
      isRequired: true,
    })
    .returning();

  const [storageGroup] = await db
    .insert(optionGroups)
    .values({
      name: 'ذخیره‌سازی',
      productId: macbook.id,
      isRequired: true,
    })
    .returning();

  // گزینه‌های RAM برای مک‌بوک
  await db.insert(options).values([
    {
      name: '۱۶ گیگابایت',
      optionGroupId: ramGroup.id,
      priceModifier: 0,
      isDefault: true,
    },
    {
      name: '۳۲ گیگابایت',
      optionGroupId: ramGroup.id,
      priceModifier: 40000000, // 4,000,000 تومان اضافه
    },
  ]);

  // گزینه‌های ذخیره‌سازی برای مک‌بوک
  await db.insert(options).values([
    {
      name: '۵۱۲ گیگابایت SSD',
      optionGroupId: storageGroup.id,
      priceModifier: 0,
      isDefault: true,
    },
    {
      name: '۱ ترابایت SSD',
      optionGroupId: storageGroup.id,
      priceModifier: 50000000, // 5,000,000 تومان اضافه
    },
  ]);

  // 6. گزینه‌ها برای تی‌شرت نخی
  const [sizeGroup] = await db
    .insert(optionGroups)
    .values({
      name: 'سایز',
      productId: cottonTshirt.id,
      isRequired: true,
    })
    .returning();

  const [colorGroup] = await db
    .insert(optionGroups)
    .values({
      name: 'رنگ',
      productId: cottonTshirt.id,
      isRequired: false,
    })
    .returning();

  // گزینه‌های سایز
  await db.insert(options).values([
    {
      name: 'کوچک',
      optionGroupId: sizeGroup.id,
      priceModifier: 0,
    },
    {
      name: 'متوسط',
      optionGroupId: sizeGroup.id,
      priceModifier: 0,
      isDefault: true,
    },
    {
      name: 'بزرگ',
      optionGroupId: sizeGroup.id,
      priceModifier: 0,
    },
    {
      name: 'خیلی بزرگ',
      optionGroupId: sizeGroup.id,
      priceModifier: 200000, // 20,000 تومان اضافه
    },
  ]);

  // گزینه‌های رنگ
  await db.insert(options).values([
    {
      name: 'سفید',
      optionGroupId: colorGroup.id,
      priceModifier: 0,
      isDefault: true,
    },
    {
      name: 'مشکی',
      optionGroupId: colorGroup.id,
      priceModifier: 0,
    },
    {
      name: 'آبی',
      optionGroupId: colorGroup.id,
      priceModifier: 0,
    },
    {
      name: 'طلایی پرمیوم',
      optionGroupId: colorGroup.id,
      priceModifier: 500000, // 50,000 تومان اضافه
    },
  ]);

  console.log('گزینه‌های محصولات درج شدند!');

  // 7. نمایش داده‌های درج شده
  console.log('\n=== دسته‌بندی‌های اصلی ===');
  const allParentCategories = await db.select().from(parentCategories);
  console.log(allParentCategories);

  console.log('\n=== محصولات ===');
  const allProducts = await db.select().from(products);
  console.log(allProducts);

  console.log('\n=== گزینه‌های محصولات ===');
  const allOptionGroups = await db.select().from(optionGroups);
  const allOptions = await db.select().from(options);
  console.log('گروه‌های گزینه:', allOptionGroups);
  console.log('گزینه‌ها:', allOptions);

  console.log('\nتمام داده‌ها با موفقیت درج شدند! ✅');
}

main().catch(console.error);
