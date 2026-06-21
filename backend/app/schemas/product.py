"""
backend/app/schemas/product.py
────────────────────────────────
Pydantic schemas for product request/response validation.
"""

from datetime import datetime
from pydantic import BaseModel
from app.schemas.product_variant import VariantCreate, VariantOut


class ProductCreate(BaseModel):
    """Data required to create a new product."""
    name: str
    description: str | None = None
    price: float
    stock: int = 0
    image_url: str | None = None
    category: str | None = None
    variants: list[VariantCreate] | None = None


class ProductUpdate(BaseModel):
    """All fields optional — only update what's provided."""
    name: str | None = None
    description: str | None = None
    price: float | None = None
    stock: int | None = None
    image_url: str | None = None
    category: str | None = None
    is_available: bool | None = None
    variants: list[VariantCreate] | None = None


class ProductOut(BaseModel):
    """Full product data returned to authenticated seller."""
    id: str
    store_id: str
    name: str
    slug: str | None
    description: str | None
    price: float
    stock: int
    image_url: str | None
    category: str | None
    is_available: bool
    created_at: datetime
    updated_at: datetime
    variants: list[VariantOut] = []

    model_config = {"from_attributes": True}


class ProductPublic(BaseModel):
    """Limited product data for public storefront — no internal fields."""
    id: str
    name: str
    slug: str | None
    description: str | None
    price: float
    stock: int
    image_url: str | None
    category: str | None
    is_available: bool
    variants: list[VariantOut] = []

    model_config = {"from_attributes": True}