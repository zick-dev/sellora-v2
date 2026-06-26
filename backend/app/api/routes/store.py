"""
app/api/routes/store.py
────────────────────────
Store management routes.

Endpoints:
  POST /api/store/setup   — Create store during onboarding (once per user)
  GET  /api/store/me      — Get the current user's store
  PUT  /api/store/me      — Update store details (settings page)

All routes require a valid JWT — the user must be logged in.
The current user is extracted from the token via get_current_user.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.store import Store
from app.models.user import User
from app.schemas.store import StoreOut, StoreSetupRequest, StoreUpdateRequest

router = APIRouter(prefix="/store", tags=["Store"])


# ── POST /api/store/setup ─────────────────────────────────────────
@router.post(
    "/setup",
    response_model=StoreOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create store during onboarding",
)
async def setup_store(
    payload: StoreSetupRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Called once from the onboarding Step 2 page.

    Checks:
    1. User doesn't already have a store (prevent duplicates)
    2. Slug isn't taken by another store

    Returns the newly created store.
    """
    # 1. Check if user already completed onboarding
    existing = await db.execute(
        select(Store).where(Store.user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Store already exists. Use PUT /api/store/me to update it.",
        )

    # 2. Check slug availability
    slug_taken = await db.execute(
        select(Store).where(Store.slug == payload.slug)
    )
    if slug_taken.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This store URL is already taken. Please choose a different one.",
        )

    # 3. Create the store
    store = Store(
        user_id=current_user.id,
        store_name=payload.store_name,
        slug=payload.slug,
        description=payload.description,
    )
    db.add(store)
    await db.flush()   # Get the ID without committing yet
    await db.refresh(store)

    return store

# ── GET /api/store/slug/{slug} ────────────────────────────────────
# Public route — no authentication required.
# Used by the public storefront page (app/store/[slug]/page.tsx)
# to load store details when a customer visits a store link.
# Example: GET /api/store/slug/janes-boutique
@router.get(
    "/slug/{slug}",
    response_model=StoreOut,
    summary="Get store by slug — public",
)
async def get_store_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint — no auth required.
    Called by the storefront page to load store details.
    """
    result = await db.execute(
        select(Store).where(Store.slug == slug)
    )
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found",
        )
    return store

# ── GET /api/store/me ─────────────────────────────────────────────
@router.get(
    "/me",
    response_model=StoreOut,
    summary="Get current user's store",
)
async def get_my_store(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the store owned by the logged-in user.
    Called on dashboard load to display store info.

    Raises 404 if user hasn't completed onboarding yet —
    the frontend should redirect to /onboarding in that case.
    """
    result = await db.execute(
        select(Store).where(Store.user_id == current_user.id)
    )
    store = result.scalar_one_or_none()

    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found. Please complete onboarding.",
        )

    return store


# ── PUT /api/store/me ─────────────────────────────────────────────
@router.put(
    "/me",
    response_model=StoreOut,
    summary="Update store details",
)
async def update_my_store(
    payload: StoreUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates store name, description, or logo.
    Used from the Store Settings page.
    Only fields included in the payload are updated.
    """
    result = await db.execute(
        select(Store).where(Store.user_id == current_user.id)
    )
    store = result.scalar_one_or_none()

    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found.",
        )

    # Only update fields that were actually sent
    if payload.store_name is not None:
        store.store_name = payload.store_name
    if payload.description is not None:
        store.description = payload.description
    if payload.logo_url is not None:
        store.logo_url = payload.logo_url
    if payload.banner_url is not None:
        store.banner_url = payload.banner_url
    if payload.banner_type is not None:
        store.banner_type = payload.banner_type
    if payload.category_type is not None:
        store.category_type = payload.category_type
    if payload.theme_color is not None:
        store.theme_color = payload.theme_color
    if payload.primary_color is not None:
        store.primary_color = payload.primary_color
    if payload.secondary_color is not None:
        store.secondary_color = payload.secondary_color
    if payload.accent_color is not None:
        store.accent_color = payload.accent_color
    if payload.theme is not None:
        store.theme = payload.theme
    if payload.base_currency is not None:
        store.base_currency = payload.base_currency
    if payload.whatsapp is not None:
        store.whatsapp = payload.whatsapp
    if payload.instagram is not None:
        store.instagram = payload.instagram
    if payload.categories is not None:
        store.categories = payload.categories
    if payload.popup_enabled is not None:
        store.popup_enabled = payload.popup_enabled
    if payload.popup_discount is not None:
        store.popup_discount = payload.popup_discount
    if payload.popup_message is not None:
        store.popup_message = payload.popup_message
    if payload.delivery_fee is not None:
        store.delivery_fee = payload.delivery_fee
    if payload.free_delivery_above is not None:
        store.free_delivery_above = payload.free_delivery_above
    if payload.bank_name is not None:
        store.bank_name = payload.bank_name
    if payload.account_name is not None:
        store.account_name = payload.account_name
    if payload.account_number is not None:
        store.account_number = payload.account_number
    if payload.show_trust_bar is not None:
        store.show_trust_bar = payload.show_trust_bar
    # Persist all store updates to the database.
    await db.commit()

    # Refresh instance with latest database values.
    await db.refresh(store)


    return store