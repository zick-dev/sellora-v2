"""
backend/app/schemas/order.py
──────────────────────────────
Pydantic schemas for order request/response validation.
"""
from datetime import datetime
from pydantic import BaseModel


class OrderCreate(BaseModel):
    """Data submitted by customer when placing an order."""
    product_id:        str
    variant_id:        str | None = None
    variant_description: str | None = None
    customer_name:     str
    customer_phone:    str
    customer_note:     str | None = None
    quantity:          int = 1
    discount_percent:  int = 0
    discount_code:     str | None = None
    delivery_address:  str | None = None
    payment_method:    str = 'pay_on_delivery'
    transfer_receipt_url: str | None = None


class OrderStatusUpdate(BaseModel):
    """Used by seller to update order status."""
    status: str  # pending | confirmed | processing | delivered | cancelled


class OrderOut(BaseModel):
    """Full order data returned to seller."""
    id:                   str
    store_id:             str
    product_id:           str
    variant_id:           str | None
    variant_description:  str | None
    customer_name:        str
    customer_phone:       str
    customer_note:        str | None
    quantity:             int
    unit_price:           float
    total_price:          float
    discount_percent:     int
    discount_code:        str | None
    delivery_address:     str | None
    delivery_fee_applied: float
    payment_method: str | None
    transfer_receipt_url: str | None
    order_number:         str | None
    status:               str
    created_at:           datetime
    updated_at:           datetime

    model_config = {"from_attributes": True}