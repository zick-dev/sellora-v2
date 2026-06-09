"""
backend/app/schemas/order.py
──────────────────────────────
Pydantic schemas for order request/response validation.
"""

from datetime import datetime
from pydantic import BaseModel


class OrderCreate(BaseModel):
    """Data submitted by customer when placing an order."""
    product_id: str
    customer_name: str
    customer_phone: str
    customer_note: str | None = None
    quantity: int = 1


class OrderStatusUpdate(BaseModel):
    """Used by seller to update order status."""
    status: str  # pending | confirmed | processing | delivered | cancelled


class OrderOut(BaseModel):
    """Full order data returned to seller."""
    id: str
    store_id: str
    product_id: str
    customer_name: str
    customer_phone: str
    customer_note: str | None
    quantity: int
    unit_price: float
    total_price: float
    order_number: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}