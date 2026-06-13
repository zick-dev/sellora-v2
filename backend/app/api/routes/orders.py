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
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.order import Order
from app.models.product import Product
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
    "/",
    response_model=OrderOut,
    status_code=201,
    summary="Place an order (public — no auth required)",
)
async def create_order(
    payload: OrderCreate,
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
    if product.stock < payload.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Only {product.stock} units available"
        )

    # Calculate totals
    unit_price = float(product.price)
    subtotal = unit_price * payload.quantity

    # Apply discount if present (validate range 0-90%)
    discount_percent = max(0, min(payload.discount_percent or 0, 90))
    discount_amount = round(subtotal * discount_percent / 100)
    total_price = subtotal - discount_amount

    # Generate unique order number
    order_number = generate_order_number()

    # Deduct stock
    product.stock -= payload.quantity

    order = Order(
        store_id=product.store_id,
        product_id=payload.product_id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_note=payload.customer_note,
        quantity=payload.quantity,
        unit_price=unit_price,
        total_price=total_price,
        discount_percent=discount_percent,
        discount_code=payload.discount_code,
        order_number=order_number,
        status="pending",
    )
    db.add(order)
    await db.flush()
    await db.refresh(order)
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
