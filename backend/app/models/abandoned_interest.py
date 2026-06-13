"""
backend/app/models/abandoned_interest.py
─────────────────────────────────────────
Tracks customers who viewed a product but didn't complete an order.
Used for the Lead Recovery feature in the seller dashboard.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AbandonedInterest(Base):
    __tablename__ = "abandoned_interests"

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
        nullable=True,  # Can be null for popup leads without a specific product
    )

    # ── Customer Info (may be partial if they didn't fill form) ──
    customer_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)

    # ── Status ───────────────────────────────────────────────────
    # True when customer eventually placed an order
    is_converted: Mapped[bool] = mapped_column(Boolean, default=False)

    # Where the lead came from: 'checkout' or 'popup'
    source: Mapped[str] = mapped_column(String(20), default='checkout', nullable=False)

    # True when seller has sent a follow-up WhatsApp message
    follow_up_sent: Mapped[bool] = mapped_column(Boolean, default=False)

    # ── Timestamps ───────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<AbandonedInterest id={self.id}>"