"""
backend/app/models/product.py
──────────────────────────────
Product model — represents items a seller lists in their store.
Each product belongs to one store.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    # ── Primary Key ──────────────────────────────────────────────
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # ── Foreign Key — links product to a store ───────────────────
    store_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Product Details ──────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(250), nullable=False)

    # URL-friendly version of the name e.g. "ankara-wrap-top"
    slug: Mapped[str | None] = mapped_column(String(250), nullable=True)

    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Price stored as decimal for precision e.g. 8500.00
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    # How many units are available
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # URL to product image (Cloudinary, S3, or direct URL)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # e.g. "Fashion", "Electronics", "Food"
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # False hides product from storefront without deleting it
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)

    # ── Timestamps ───────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationship ─────────────────────────────────────────────
    variants: Mapped[list["ProductVariant"]] = relationship(
        "ProductVariant",
        backref="product",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name}>"