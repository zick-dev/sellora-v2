"""
backend/app/api/routes/orders.py
──────────────────────────────────
Order management endpoints.

Public routes (no auth):
  POST /api/orders/ — customer places an order

Seller routes (JWT required):
  GET /api/orders/{store_id}           — list all orders
  PUT /api/orders/{order_id}/status    — update order status
"""

import random
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.order_reminder import check_and_send_order_reminders
from app.models.order import Order
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.store import Store
from app.models.user import User
from app.schemas.order import OrderCreate, OrderOut, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["Orders"])

# Valid status transitions — prevents invalid status changes
VALID_TRANSITIONS = {
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["processing", "cancelled"],
    "processing": ["delivered", "cancelled"],
    "delivered": [],
    "cancelled": [],
}


def generate_order_number() -> str:
    """Generate readable order number like SEL-88210."""
    return f"SEL-{random.randint(10000, 99999)}"


@router.post(
    "/demo/{store_id}",
    response_model=OrderOut,
    summary="Create a sample demo order for a new merchant to preview",
)
async def create_demo_order(
    store_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generates a realistic sample order using one of the merchant's own
    real products, so brand-new sellers can see what an order looks like
    before they have real traffic. Marked is_demo=True -- excluded from
    revenue totals, abandoned-order detection, and customer records.
    """
    store_result = await db.execute(
        select(Store).where(Store.id == store_id, Store.user_id == current_user.id)
    )
    store = store_result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=403, detail="Access denied")

    product_result = await db.execute(
        select(Product).where(Product.store_id == store_id).order_by(Product.created_at.desc())
    )
    product = product_result.scalars().first()
    if not product:
        raise HTTPException(
            status_code=400,
            detail="Add at least one product before previewing a demo order.",
        )

    order_number = generate_order_number()
    demo_order = Order(
        store_id=store_id,
        product_id=product.id,
        customer_name="Chidinma A.",
        customer_phone="2348012345678",
        customer_note="This is what a real customer order will look like!",
        quantity=1,
        unit_price=product.price,
        total_price=product.price,
        discount_percent=0,
        delivery_address=None,
        delivery_fee_applied=0,
        order_number=order_number,
        status="pending",
        payment_method="pay_on_delivery",
        is_demo=True,
    )
    db.add(demo_order)
    await db.flush()
    await db.refresh(demo_order)
    return OrderOut.model_validate(demo_order)


@router.post(
    "/",
    response_model=OrderOut,
    status_code=201,
    summary="Place an order (public — no auth required)",
)
async def create_order(
    payload: OrderCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Called by customer on public storefront.
    Validates product exists, has stock, then creates order.
    """
    # Get product and verify it's available
    result = await db.execute(
        select(Product).where(Product.id == payload.product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product.is_available:
        raise HTTPException(status_code=400, detail="Product is not available")

    # ── Variant handling ────────────────────────────────────────────
    variant = None
    if payload.variant_id:
        variant_result = await db.execute(
            select(ProductVariant).where(
                ProductVariant.id == payload.variant_id,
                ProductVariant.product_id == product.id,
            )
        )
        variant = variant_result.scalar_one_or_none()
        if not variant:
            raise HTTPException(status_code=404, detail="Selected variant not found")
        if not variant.is_available:
            raise HTTPException(status_code=400, detail="Selected variant is not available")
        if variant.stock < payload.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Only {variant.stock} units available for this variant"
            )
    else:
        if product.stock < payload.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Only {product.stock} units available"
            )

   # Calculate totals
    unit_price = float(variant.price) if (variant and variant.price is not None) else float(product.price)
    subtotal = unit_price * payload.quantity

    # Apply discount if present (validate range 0-90%)
    discount_percent = max(0, min(payload.discount_percent or 0, 90))
    discount_amount = round(subtotal * discount_percent / 100)
    discounted_subtotal = subtotal - discount_amount

    # Apply delivery fee if order is below free_delivery_above threshold
    store_result = await db.execute(
        select(Store).where(Store.id == product.store_id)
    )
    store = store_result.scalar_one_or_none()
    delivery_fee_applied = 0.0
    if store and float(store.delivery_fee or 0) > 0:
        if discounted_subtotal < float(store.free_delivery_above or 0):
            delivery_fee_applied = float(store.delivery_fee)

    total_price = discounted_subtotal + delivery_fee_applied

    # Generate unique order number
    order_number = generate_order_number()

    # Deduct stock from variant if present, otherwise the base product
    if variant:
        variant.stock -= payload.quantity
    else:
        product.stock -= payload.quantity

    # Set initial status based on payment method
    initial_status = "awaiting_verification" if payload.payment_method == "bank_transfer" else "pending"

    order = Order(
        store_id=product.store_id,
        product_id=payload.product_id,
        variant_id=variant.id if variant else None,
        variant_description=payload.variant_description,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_note=payload.customer_note,
        quantity=payload.quantity,
        unit_price=unit_price,
        total_price=total_price,
        discount_percent=discount_percent,
        discount_code=payload.discount_code,
        delivery_address=payload.delivery_address,
        delivery_fee_applied=delivery_fee_applied,
        order_number=order_number,
        status=initial_status,
        payment_method=payload.payment_method or 'pay_on_delivery',
        transfer_receipt_url=payload.transfer_receipt_url,
    )
    db.add(order)
    await db.flush()
    await db.refresh(order)

    # Fire background reminder check for old pending orders
    background_tasks.add_task(check_and_send_order_reminders, db)

    return OrderOut.model_validate(order)


@router.get(
    "/{store_id}",
    response_model=list[OrderOut],
    summary="List all orders for a store",
)
async def list_orders(
    store_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns all orders for seller's store, newest first."""
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
        select(Order)
        .where(Order.store_id == store_id)
        .order_by(Order.created_at.desc())
    )
    return [OrderOut.model_validate(o) for o in result.scalars().all()]


@router.put(
    "/{order_id}/status",
    response_model=OrderOut,
    summary="Update order status",
)
async def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update order status with validation of allowed transitions."""
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Verify store ownership
    store_result = await db.execute(
        select(Store).where(
            Store.id == order.store_id,
            Store.user_id == current_user.id,
        )
    )
    if not store_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")

    # Validate the status transition
    allowed = VALID_TRANSITIONS.get(order.status, [])
    if payload.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change status from '{order.status}' to '{payload.status}'"
        )

    order.status = payload.status
    await db.flush()
    await db.refresh(order)
    return OrderOut.model_validate(order)


@router.delete(
    "/demo/{order_id}",
    status_code=204,
    summary="Delete a demo order (demo orders only)",
)
async def delete_demo_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Removes a demo order once the merchant has seen it. Refuses to delete real orders."""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if not order.is_demo:
        raise HTTPException(status_code=400, detail="Only demo orders can be deleted this way.")

    store_result = await db.execute(
        select(Store).where(Store.id == order.store_id, Store.user_id == current_user.id)
    )
    if not store_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")

    await db.delete(order)
    await db.flush()
    return None
