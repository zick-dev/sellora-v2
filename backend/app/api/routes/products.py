"""
backend/app/api/routes/products.py
────────────────────────────────────
Product management endpoints.

Public routes (no auth):
  GET /api/products/public/{store_id} — list available products

Seller routes (JWT required):
  POST /api/products/store/{store_id} — add product
  GET  /api/products/store/{store_id} — list all products
  PUT  /api/products/{product_id}     — update product
  DELETE /api/products/{product_id}   — delete product
"""

import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.store import Store
from app.models.user import User
from app.schemas.product import ProductCreate, ProductOut, ProductPublic, ProductUpdate

router = APIRouter(prefix="/products", tags=["Products"])

FREE_PRODUCT_LIMIT = 15


def generate_slug(name: str) -> str:
    """Convert product name to URL-friendly slug e.g. 'Ankara Top' → 'ankara-top'"""
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    return slug


def user_is_pro(user: User) -> bool:
    """Check if user has an active Pro subscription."""
    return (
        user.plan == "pro" and
        user.plan_expires_at is not None and
        user.plan_expires_at > datetime.now(timezone.utc)
    )


async def get_store_or_403(store_id: str, owner_id: str, db: AsyncSession) -> Store:
    """Verify store exists and belongs to the current user. Raises 403 if not."""
    result = await db.execute(
        select(Store).where(
            Store.id == store_id,
            Store.user_id == owner_id,
        )
    )
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Store not found or access denied",
        )
    return store


# ── Public Routes ─────────────────────────────────────────────────

@router.get(
    "/public/{store_id}",
    response_model=list[ProductPublic],
    summary="List available products for storefront (public)",
)
async def list_public_products(
    store_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Returns only available products for the public storefront."""
    result = await db.execute(
        select(Product).where(
            Product.store_id == store_id,
            Product.is_available == True,  # noqa: E712
            Product.stock > 0,
        ).order_by(Product.created_at.desc())
    )
    return [ProductPublic.model_validate(p) for p in result.scalars().all()]


# ── Seller Routes ─────────────────────────────────────────────────

@router.post(
    "/store/{store_id}",
    response_model=ProductOut,
    status_code=201,
    summary="Add a product to store",
)
async def create_product(
    store_id: str,
    payload: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new product. Auto-generates slug from name.
    Free plan limited to 15 products. Pro plan is unlimited.
    """
    await get_store_or_403(store_id, current_user.id, db)

    # ── Plan enforcement ──────────────────────────────────────────
    if not user_is_pro(current_user):
        count_result = await db.execute(
            select(func.count()).where(Product.store_id == store_id)
        )
        product_count = count_result.scalar()
        if product_count >= FREE_PRODUCT_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Free plan is limited to {FREE_PRODUCT_LIMIT} products. Upgrade to Pro for unlimited products.",
            )

    # ── Generate unique slug ──────────────────────────────────────
    base_slug = generate_slug(payload.name)
    slug = base_slug
    counter = 2
    while True:
        existing = await db.execute(
            select(Product).where(
                Product.store_id == store_id,
                Product.slug == slug,
            )
        )
        if not existing.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    product = Product(
        store_id=store_id,
        name=payload.name,
        slug=slug,
        description=payload.description,
        price=float(payload.price),
        stock=payload.stock,
        image_url=payload.image_url,
        category=payload.category,
    )
    db.add(product)
    await db.flush()

    # ── Create variants if provided ────────────────────────────────
    if payload.variants:
        for v in payload.variants:
            variant = ProductVariant(
                product_id=product.id,
                variant_type_1=v.variant_type_1,
                variant_value_1=v.variant_value_1,
                variant_type_2=v.variant_type_2,
                variant_value_2=v.variant_value_2,
                price=v.price,
                stock=v.stock,
                is_available=v.is_available,
            )
            db.add(variant)
        await db.flush()

    await db.refresh(product)
    return ProductOut.model_validate(product)


@router.get(
    "/store/{store_id}",
    response_model=list[ProductOut],
    summary="List all products for seller",
)
async def list_products(
    store_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns all products including unavailable ones — for seller dashboard."""
    await get_store_or_403(store_id, current_user.id, db)
    result = await db.execute(
        select(Product)
        .where(Product.store_id == store_id)
        .order_by(Product.created_at.desc())
    )
    return [ProductOut.model_validate(p) for p in result.scalars().all()]


@router.put(
    "/{product_id}",
    response_model=ProductOut,
    summary="Update a product",
)
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update product fields. Only provided fields are updated."""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await get_store_or_403(product.store_id, current_user.id, db)

    update_data = payload.model_dump(exclude_unset=True)
    variants_payload = update_data.pop("variants", None)

    for field, value in update_data.items():
        setattr(product, field, value)

    # ── Replace variants if provided (delete old, create new) ──────
    if variants_payload is not None:
        existing_variants = await db.execute(
            select(ProductVariant).where(ProductVariant.product_id == product.id)
        )
        for old_variant in existing_variants.scalars().all():
            await db.delete(old_variant)
        await db.flush()

        for v in variants_payload:
            variant = ProductVariant(
                product_id=product.id,
                variant_type_1=v.get("variant_type_1"),
                variant_value_1=v.get("variant_value_1"),
                variant_type_2=v.get("variant_type_2"),
                variant_value_2=v.get("variant_value_2"),
                price=v.get("price"),
                stock=v.get("stock", 0),
                is_available=v.get("is_available", True),
            )
            db.add(variant)
        await db.flush()

    await db.refresh(product)
    return ProductOut.model_validate(product)


@router.delete(
    "/{product_id}",
    status_code=204,
    summary="Delete a product",
)
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete a product from the store."""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await get_store_or_403(product.store_id, current_user.id, db)
    await db.delete(product)
    await db.flush()