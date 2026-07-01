"""
backend/app/schemas/product_image.py
──────────────────────────────────────
Pydantic schemas for product gallery images.
"""

from datetime import datetime
from pydantic import BaseModel


class ProductImageCreate(BaseModel):
    image_url: str
    sort_order: int = 0


class ProductImageOut(BaseModel):
    id: str
    image_url: str
    sort_order: int

    model_config = {"from_attributes": True}
