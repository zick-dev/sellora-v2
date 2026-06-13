"""
backend/app/schemas/abandoned.py
──────────────────────────────────
Schemas for abandoned interest tracking.
"""

from datetime import datetime
from pydantic import BaseModel


class AbandonedCreate(BaseModel):
    """Posted by frontend when customer opens order form."""
    store_id: str
    product_id: str | None = None
    customer_name: str | None = None
    customer_phone: str | None = None
    source: str = 'checkout'


class AbandonedOut(BaseModel):
    """Abandoned interest data returned to seller."""
    id: str
    store_id: str
    product_id: str | None = None
    customer_name: str | None
    customer_phone: str | None
    is_converted: bool
    follow_up_sent: bool
    created_at: datetime
    product_name: str | None = None
    source: str

    model_config = {"from_attributes": True}