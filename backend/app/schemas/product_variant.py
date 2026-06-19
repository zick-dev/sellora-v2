"""
backend/app/schemas/product_variant.py
──────────────────────────────────────────
Pydantic schemas for product variant request/response validation.
"""

from pydantic import BaseModel


class VariantCreate(BaseModel):
    """A single variant combination submitted when creating/editing a product."""
    variant_type_1: str | None = None
    variant_value_1: str | None = None
    variant_type_2: str | None = None
    variant_value_2: str | None = None
    price: float | None = None
    stock: int = 0
    is_available: bool = True


class VariantOut(BaseModel):
    id: str
    product_id: str
    variant_type_1: str | None
    variant_value_1: str | None
    variant_type_2: str | None
    variant_value_2: str | None
    price: float | None
    stock: int
    is_available: bool

    model_config = {"from_attributes": True}
