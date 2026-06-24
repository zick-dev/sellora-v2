"""
backend/app/api/routes/fx.py
──────────────────────────────
Public exchange rate endpoint for storefront price conversion.

Returns cached exchange rates from a given base currency.
The storefront calls this once on page load, then converts
all product prices client-side — no extra API calls per product.
"""

from fastapi import APIRouter, HTTPException, status
from app.services.fx_service import get_rates

router = APIRouter(prefix="/fx", tags=["Currency"])


@router.get(
    "/rates/{base_currency}",
    summary="Get exchange rates from a base currency (public)",
)
async def get_exchange_rates(base_currency: str):
    """
    Returns exchange rates from the given base currency to all
    supported currencies. Cached for 12 hours server-side.
    Used by the storefront to convert product prices for display.
    """
    rates = await get_rates(base_currency.upper())
    if not rates:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Exchange rates temporarily unavailable",
        )
    return {"base": base_currency.upper(), "rates": rates}
