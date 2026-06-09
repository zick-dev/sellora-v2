"""
backend/app/models/order.py
────────────────────────────
Order model — represents a customer purchase from a store.

Flow:
  pending → confirmed → processing → delivered
                     ↘ cancelled
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, Numeric, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    # ── Primary Key ──────────────────────────────────────────────
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # ── Foreign Keys ─────────────────────────────────────────────
    store_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )

    # ── Customer Details (entered by customer on storefront) ─────
    customer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(30), nullable=False)
    customer_note: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ── Order Details ────────────────────────────────────────────
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Price at time of order — stored separately so price changes
    # don't affect historical orders
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    # Human-readable order number e.g. SEL-88210
    order_number: Mapped[str | None] = mapped_column(
        String(20), nullable=True, unique=True, index=True
    )

    # ── Status ───────────────────────────────────────────────────
    # pending → confirmed → processing → delivered | cancelled
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False, index=True
    )

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

    def __repr__(self) -> str:
        return f"<Order id={self.id} status={self.status}>"