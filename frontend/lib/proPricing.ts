/**
 * lib/proPricing.ts
 * ────────────────────
 * Region-based Pro plan pricing. Africa gets local pricing ($5/mo
 * equivalent in NGN), everywhere else pays $15/mo USD. Detected via
 * IP geolocation (same approach as storefront currency detection).
 */

export interface ProPricing {
  amount: number;
  currency: 'NGN' | 'USD';
  display: string; // e.g. "₦5,000/month" or "$15/month"
  region: 'africa' | 'global';
}

const AFRICAN_COUNTRY_CODES = new Set([
  'NG', 'GH', 'KE', 'ZA', 'UG', 'TZ', 'EG', 'MA', 'DZ', 'TN', 'ET', 'SN',
  'CI', 'CM', 'ZM', 'ZW', 'RW', 'ML', 'BF', 'NE', 'TD', 'SO', 'BJ', 'BI',
  'TG', 'SL', 'LY', 'LR', 'MR', 'ER', 'GM', 'BW', 'GA', 'LS', 'GW', 'GQ',
  'MU', 'SZ', 'DJ', 'KM', 'CV', 'ST', 'SC', 'SD', 'SS', 'MZ', 'MW', 'NA',
  'AO', 'CD', 'CG', 'CF',
]);

export async function detectProPricing(): Promise<ProPricing> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    const countryCode = data?.country_code as string | undefined;
    if (countryCode && AFRICAN_COUNTRY_CODES.has(countryCode)) {
      return { amount: 5000, currency: 'NGN', display: '\u20A65,000/month', region: 'africa' };
    }
  } catch {
    // Fall through to global default on any detection failure
  }
  return { amount: 15, currency: 'USD', display: '$15/month', region: 'global' };
}
