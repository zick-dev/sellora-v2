"""
app/models/product_variant.py
────────────────────────────────
ProductVariant model — represents a specific buyable combination of a
product (e.g. Size: Large + Color: Red), each with its own price and
stock count.

A product can have zero variants (simple product) or many (e.g. a
clothing item with Size x Color combinations).

variant_type_1/2 are the dimension names (e.g. "Size", "Color"),
variant_value_1/2 are the actual values (e.g. "Large", "Red").
The second dimension is optional — a product might only vary by Size.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    product_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # First variant dimension — e.g. type="Size", value="Large"
    variant_type_1: Mapped[str | None] = mapped_column(String(30), nullable=True)
    variant_value_1: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Second variant dimension — e.g. type="Color", value="Red"
    variant_type_2: Mapped[str | None] = mapped_column(String(30), nullable=True)
    variant_value_2: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Overrides the product's base price if set; null = use product.price
    price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<ProductVariant {self.variant_value_1}/{self.variant_value_2} stock={self.stock}>"
