/**
 * lib/storefrontCart.ts
 * ───────────────────────
 * Shared cart persistence for the storefront and standalone product pages.
 * Cart is scoped per-store (by slug) so a buyer browsing multiple stores
 * doesn't mix carts. Backed by localStorage so cart state survives
 * navigation between the storefront and individual product pages.
 */

export interface StoredCartItem {
  productId: string;
  productName: string;
  productImageUrl: string | null;
  productPrice: number;
  productPriceCurrency: string | null;
  variantId?: string | null;
  variantLabel?: string | null;
  variantPrice?: number | null;
  quantity: number;
  cartKey: string;
}

function cartStorageKey(storeSlug: string): string {
  return `kormerce_cart_${storeSlug}`;
}

export function getStoredCart(storeSlug: string): StoredCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(cartStorageKey(storeSlug));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredCart(storeSlug: string, items: StoredCartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(cartStorageKey(storeSlug), JSON.stringify(items));
  } catch {}
}

export function addToStoredCart(storeSlug: string, item: StoredCartItem): StoredCartItem[] {
  const cart = getStoredCart(storeSlug);
  const existing = cart.find(c => c.cartKey === item.cartKey);
  let updated: StoredCartItem[];
  if (existing) {
    updated = cart.map(c => c.cartKey === item.cartKey ? { ...c, quantity: c.quantity + item.quantity } : c);
  } else {
    updated = [...cart, item];
  }
  saveStoredCart(storeSlug, updated);
  return updated;
}
