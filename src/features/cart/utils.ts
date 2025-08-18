import type { LocalCartItem, CartItem } from '@/server/db/schema';

// Calculate price for a product with selected options
export function calculateProductPrice(
  basePrice: number,
  selectedOptions: { optionGroupId: number; optionId: number }[],
  options: Array<{ id: number; optionGroupId: number; priceModifier: number }>
): number {
  const totalModifier = selectedOptions.reduce((sum, selected) => {
    const option = options.find((opt) => opt.id === selected.optionId);
    return sum + (option?.priceModifier || 0);
  }, 0);

  return basePrice + totalModifier;
}

// Check if two cart items are the same (same product + same options)
export function isSameCartItem(
  item1: {
    productId: number;
    selectedOptions: LocalCartItem['selectedOptions'];
  },
  item2: {
    productId: number;
    selectedOptions: LocalCartItem['selectedOptions'];
  }
): boolean {
  if (item1.productId !== item2.productId) {
    return false;
  }

  // Handle null/undefined options
  const options1 = item1.selectedOptions || [];
  const options2 = item2.selectedOptions || [];

  // If both have no options, they're the same
  if (options1.length === 0 && options2.length === 0) {
    return true;
  }

  // If different lengths, they're different
  if (options1.length !== options2.length) {
    return false;
  }

  // Sort both arrays and compare
  const sorted1 = [...options1].sort((a, b) => {
    if (a.optionGroupId !== b.optionGroupId) {
      return a.optionGroupId - b.optionGroupId;
    }
    return a.optionId - b.optionId;
  });

  const sorted2 = [...options2].sort((a, b) => {
    if (a.optionGroupId !== b.optionGroupId) {
      return a.optionGroupId - b.optionGroupId;
    }
    return a.optionId - b.optionId;
  });

  // Compare each option
  return sorted1.every((opt1, index) => {
    const opt2 = sorted2[index];
    return (
      opt1.optionGroupId === opt2.optionGroupId &&
      opt1.optionId === opt2.optionId
    );
  });
}

// Merge local cart with database cart
export function mergeCartItems(
  localItems: LocalCartItem[],
  dbItems: CartItem[]
): LocalCartItem[] {
  const merged = [...dbItems.map(dbItemToLocal)];

  localItems.forEach((localItem) => {
    const existingIndex = merged.findIndex((item) =>
      isSameCartItem(item, localItem)
    );

    if (existingIndex >= 0) {
      // Merge quantities
      merged[existingIndex].quantity += localItem.quantity;
    } else {
      // Add new item
      merged.push(localItem);
    }
  });

  return merged;
}

// Convert database cart item to local cart item format
function dbItemToLocal(dbItem: CartItem): LocalCartItem {
  return {
    productId: dbItem.productId,
    quantity: dbItem.quantity,
    selectedOptions: dbItem.selectedOptions || [],
    unitPrice: dbItem.unitPrice,
    timestamp: dbItem.updatedAt.toISOString(),
  };
}

// Convert local cart item to database format
export function localItemToDb(
  localItem: LocalCartItem,
  cartId: number
): Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    cartId,
    productId: localItem.productId,
    quantity: localItem.quantity,
    selectedOptions: localItem.selectedOptions,
    unitPrice: localItem.unitPrice,
  };
}

// Clean up old cart items (optional - for localStorage cleanup)
export function cleanupOldCartItems(
  items: LocalCartItem[],
  maxAgeHours = 24 * 7
): LocalCartItem[] {
  const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  return items.filter((item) => {
    const itemTime = new Date(item.timestamp);
    return itemTime > cutoffTime;
  });
}

// Format price for display (assuming cents to currency)
export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR',
    maximumFractionDigits: 0,
  }).format(priceInCents);
}

// Get cart summary
export function getCartSummary(items: LocalCartItem[]) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  return {
    totalItems,
    totalPrice,
    formattedTotal: formatPrice(totalPrice),
    isEmpty: items.length === 0,
  };
}
