"""
backend/app/api/routes/abandoned.py
─────────────────────────────────────
Abandoned interest tracking for Lead Recovery feature.

Public routes:
  POST /api/abandoned/              — track interest when customer opens order form
  PUT  /api/abandoned/{id}/convert  — mark as converted when order placed

Seller routes:
  GET /api/abandoned/{store_id}           — list unconverted leads
  PUT /api/abandoned/{id}/follow-up       — mark follow-up sent
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.abandoned_interest import AbandonedInterest
from app.models.product import Product
from app.models.store import Store
from app.models.user import User
from app.schemas.abandoned import AbandonedCreate, AbandonedOut

router = APIRouter(prefix="/abandoned", tags=["Abandoned Interests"])


@router.post(
    "/",
    response_model=AbandonedOut,
    status_code=201,
    summary="Track customer interest — public",
)
async def track_interest(
    payload: AbandonedCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Called when customer opens the order form on storefront.
    Captures their interest even if they don't complete the order.
    """
    # Verify product exists
    result = await db.execute(
        select(Product).where(Product.id == payload.product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    interest = AbandonedInterest(
        store_id=payload.store_id,
        product_id=payload.product_id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
    )
    db.add(interest)
    await db.flush()
    await db.refresh(interest)

    out = AbandonedOut.model_validate(interest)
    out.product_name = product.name
    return out


@router.get(
    "/{store_id}",
    response_model=list[AbandonedOut],
    summary="Get abandoned interests for seller",
)
async def get_abandoned(
    store_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns unconverted leads for the seller's Lead Recovery dashboard."""
    # Verify ownership
    store_result = await db.execute(
        select(Store).where(
            Store.id == store_id,
            Store.user_id == current_user.id,
        )
    )
    if not store_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(AbandonedInterest).where(
            AbandonedInterest.store_id == store_id,
            AbandonedInterest.is_converted == False,  # noqa: E712
        ).order_by(AbandonedInterest.created_at.desc())
    )
    interests = result.scalars().all()

    # Attach product name to each interest
    output = []
    for interest in interests:
        prod = await db.execute(
            select(Product).where(Product.id == interest.product_id)
        )
        product = prod.scalar_one_or_none()
        out = AbandonedOut.model_validate(interest)
        out.product_name = product.name if product else None
        output.append(out)
    return output


@router.put(
    "/{interest_id}/convert",
    response_model=AbandonedOut,
    summary="Mark interest as converted",
)
async def mark_converted(
    interest_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Called when customer completes an order — removes from leads list."""
    result = await db.execute(
        select(AbandonedInterest).where(AbandonedInterest.id == interest_id)
    )
    interest = result.scalar_one_or_none()
    if not interest:
        raise HTTPException(status_code=404, detail="Not found")
    interest.is_converted = True
    await db.flush()
    await db.refresh(interest)
    return AbandonedOut.model_validate(interest)


@router.put(
    "/{interest_id}/follow-up",
    response_model=AbandonedOut,
    summary="Mark follow-up as sent",
)
async def mark_follow_up(
    interest_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Called when seller sends a WhatsApp follow-up to a lead."""
    result = await db.execute(
        select(AbandonedInterest).where(AbandonedInterest.id == interest_id)
    )
    interest = result.scalar_one_or_none()
    if not interest:
        raise HTTPException(status_code=404, detail="Not found")
    interest.follow_up_sent = True
    await db.flush()
    await db.refresh(interest)
    return AbandonedOut.model_validate(interest)