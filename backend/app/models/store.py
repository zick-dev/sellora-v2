"""
app/models/store.py
────────────────────
SQLAlchemy model for the stores table.

Each Sellora user creates exactly one store during onboarding.
The store holds the public-facing details customers see on the
storefront, and the slug is the unique URL customers visit.

Relationships:
- One store → One user (owner)
- One store → Many products (added later)
- One store → Many orders (added later)
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Store(Base):
    """
    Represents a seller's storefront on Sellora.

    Created once during onboarding. The slug becomes the
    public URL: sellora.io/<slug>
    """

    __tablename__ = "stores"

    # ── Primary Key ──────────────────────────────────────────────
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # ── Owner ────────────────────────────────────────────────────
    # Links this store to its seller. One user = one store.
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,    # Enforces one store per user at DB level
        nullable=False,
        index=True,
    )

    # ── Store Identity ───────────────────────────────────────────
    # Display name shown on the storefront and dashboard
    store_name: Mapped[str] = mapped_column(String(150), nullable=False)

    # URL-safe unique identifier: sellora.io/<slug>
    # Lowercase, hyphens only — generated from store_name on frontend
    slug: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
        comment="URL slug: sellora.io/<slug>"
    )

    # Optional seller pitch shown on the storefront header
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Store logo / banner image URL (uploaded later in settings)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

                    # Store banner — wide hero image shown at top of storefront
    banner_url: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )

    # Primary theme color for the storefront buttons and accents
    theme_color: Mapped[str] = mapped_column(
        String(20), default='#7c3aed', nullable=False
    )

    # Seller WhatsApp number for customer contact
    whatsapp: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )

    # Seller Instagram handle e.g. @luxethreads
    instagram: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )

    # JSON array of category names e.g. '["Fashion","Electronics"]'
    categories: Mapped[str] = mapped_column(
        Text, default='[]', nullable=False
    )

    # ── Status ───────────────────────────────────────────────────
    # False until store is fully set up and ready for customers
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

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
        return f"<Store id={self.id} slug={self.slug}>"