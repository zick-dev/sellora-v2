"""
app/services/fx_service.py
─────────────────────────────
Currency exchange rate service for converting product prices between
currencies at display-time (storefront) and order-time (checkout).

Uses exchangerate-api.com's Standard endpoint. Rates are cached for
12 hours in-memory since the free/basic plan only updates data once
daily anyway — no point hammering the API more often than that.

IMPORTANT: prices are NEVER mutated at rest. Each product remembers
the currency it was priced in (price_currency). Conversion only
happens when displaying to a buyer or calculating an order total,
using the most recent cached rate.
"""

import httpx
from datetime import datetime, timezone, timedelta
from app.core.config import settings

# In-memory cache: { "NGN": { "rates": {...}, "fetched_at": datetime } }
_rate_cache: dict[str, dict] = {}
CACHE_TTL = timedelta(hours=12)


async def get_rates(base_currency: str) -> dict[str, float] | None:
    """
    Fetch (or return cached) exchange rates from base_currency to all
    other supported currencies. Returns None on failure — callers should
    fall back to showing the original price unconverted rather than crash.
    """
    base_currency = base_currency.upper()
    now = datetime.now(timezone.utc)

    cached = _rate_cache.get(base_currency)
    if cached and (now - cached["fetched_at"]) < CACHE_TTL:
        return cached["rates"]

    if not settings.EXCHANGE_RATE_API_KEY:
        return None

    url = f"https://v6.exchangerate-api.com/v6/{settings.EXCHANGE_RATE_API_KEY}/latest/{base_currency}"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(url)
        if res.status_code != 200:
            return cached["rates"] if cached else None

        data = res.json()
        if data.get("result") != "success":
            return cached["rates"] if cached else None

        rates = data.get("conversion_rates", {})
        _rate_cache[base_currency] = {"rates": rates, "fetched_at": now}
        return rates

    except Exception as e:
        print(f"⚠️ FX rate fetch failed: {e}")
        return cached["rates"] if cached else None


async def convert_amount(amount: float, from_currency: str, to_currency: str) -> float | None:
    """
    Convert an amount from one currency to another.
    Returns None if conversion isn't possible (missing rates) —
    callers should fall back to the original amount + currency in that case.
    """
    from_currency = (from_currency or "USD").upper()
    to_currency = (to_currency or "USD").upper()

    if from_currency == to_currency:
        return amount

    rates = await get_rates(from_currency)
    if not rates or to_currency not in rates:
        return None

    return round(amount * rates[to_currency], 2)
