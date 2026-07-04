/**
 * lib/storefrontTemplates.ts
 * ─────────────────────────────
 * Vertical-specific visual presets for the storefront, keyed by the
 * store's existing category_type field. Phase 2.1: visual differences
 * only -- no changes to cart, checkout, or business logic. Falls back
 * to 'general' for any unmatched category_type.
 */

export interface StorefrontTemplate {
  productImageAspect: string;   // aspect-ratio for product card images
  productImageFit: 'cover' | 'contain'; // how images fill their frame
  categoryIcon: string;         // small icon shown before category label
  gridGapDesktop: number;       // px gap between product cards
  emptyStateIcon: string;       // icon shown when no products match
  heroAccentIcon: string;       // small decorative icon near store name
}

export const STOREFRONT_TEMPLATES: Record<string, StorefrontTemplate> = {
  clothing: {
    productImageAspect: '3/4',
    productImageFit: 'cover',
    categoryIcon: '👗',
    gridGapDesktop: 14,
    emptyStateIcon: '👕',
    heroAccentIcon: '✨',
  },
  electronics: {
    productImageAspect: '1/1',
    productImageFit: 'contain',
    categoryIcon: '🔌',
    gridGapDesktop: 12,
    emptyStateIcon: '💻',
    heroAccentIcon: '⚡',
  },
  food: {
    productImageAspect: '1/1',
    productImageFit: 'cover',
    categoryIcon: '🍽️',
    gridGapDesktop: 10,
    emptyStateIcon: '🍔',
    heroAccentIcon: '🔥',
  },
  beauty: {
    productImageAspect: '1/1',
    productImageFit: 'cover',
    categoryIcon: '💄',
    gridGapDesktop: 12,
    emptyStateIcon: '✨',
    heroAccentIcon: '💖',
  },
  general: {
    productImageAspect: '1/1',
    productImageFit: 'cover',
    categoryIcon: '🏷️',
    gridGapDesktop: 11,
    emptyStateIcon: '🛍️',
    heroAccentIcon: '⭐',
  },
};

export function getStorefrontTemplate(categoryType: string | undefined | null): StorefrontTemplate {
  if (!categoryType) return STOREFRONT_TEMPLATES.general;
  return STOREFRONT_TEMPLATES[categoryType] || STOREFRONT_TEMPLATES.general;
}
