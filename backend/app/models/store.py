"""
app/models/store.py
────────────────────
SQLAlchemy model for the stores table.

Each Kormerce user creates exactly one store during onboarding.
The store holds the public-facing details customers see on the
storefront, and the slug is the unique URL customers visit.

Relationships:
- One store → One user (owner)
- One store → Many products
- One store → Many orders
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Store(Base):
    """
    Represents a seller's storefront on Kormerce.

    Created once during onboarding. The slug becomes the
    public URL: <domain>/store/<slug>
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
        unique=True,  # Enforces one store per user at DB level
        nullable=False,
        index=True,
    )

    # ── Store Identity ───────────────────────────────────────────
    # Display name shown on the storefront header and dashboard
    store_name: Mapped[str] = mapped_column(String(150), nullable=False)

    # URL-safe unique identifier: <domain>/store/<slug>
    # Lowercase, hyphens only — generated from store_name on the frontend
    slug: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
        comment="URL slug: <domain>/store/<slug>",
    )

    # Optional seller pitch shown on the storefront header
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Store logo (square) and banner (wide hero) image URLs.
    # URL-only for now; Cloudinary upload replaces these inputs in update #3.
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    banner_type: Mapped[str] = mapped_column(String(10), default="image", nullable=False)
    category_type: Mapped[str] = mapped_column(String(30), default="general", nullable=False)

    # ── Branding ─────────────────────────────────────────────────
    # CANONICAL ACCENT: theme_color is the single merchant-set accent the
    # storefront and settings page actually read today (buttons, prices,
    # highlights). Kept as the source of truth deliberately — other backend
    # code may reference it, so we don't rename it blind. The premium neutral
    # palette (backgrounds, text, borders) is fixed in the frontend, NOT
    # stored per-store, which is how most premium DTC stores are built.
    theme_color: Mapped[str] = mapped_column(
        String(20),
        default="#4F46E5",
        nullable=False,
        comment="Canonical merchant accent color used by the storefront UI",
    )

    # Extended palette — reserved for the richer design system / dark-mode
    # work (update #4). NOT yet wired into the storefront; documented so it
    # isn't mistaken for the live accent. Safe to leave at defaults for now.
    primary_color: Mapped[str] = mapped_column(
        String(20), default="#0F172A", nullable=False
    )
    secondary_color: Mapped[str] = mapped_column(
        String(20), default="#FFFFFF", nullable=False
    )
    accent_color: Mapped[str] = mapped_column(
        String(20), default="#00A87A", nullable=False
    )
    theme: Mapped[str] = mapped_column(
        String(50), default="minimal", nullable=False
    )

    # ── Currency ─────────────────────────────────────────────────
    # The single source of truth for pricing. Under pay-on-delivery this is
    # also the amount the buyer physically hands over, so it is ALWAYS the
    # binding currency at cart/checkout/confirmation. Any buyer-side display
    # toggle (see show_currency_converter) only shows approximate estimates.
    # ── Bank Transfer Details ──────────────────────────────────────
    bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    account_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    account_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    bank_iban: Mapped[str | None] = mapped_column(String(40), nullable=True)
    bank_routing_number: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # ── Store Policies ─────────────────────────────
    return_policy: Mapped[str | None] = mapped_column(Text, nullable=True)
    shipping_policy: Mapped[str | None] = mapped_column(Text, nullable=True)
    terms_of_service: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Compliance ─────────────────────────────────────────────────
    compliance_status: Mapped[str] = mapped_column(String(20), default="active")
    compliance_flagged_at: Mapped[object | None] = mapped_column(DateTime, nullable=True)
    compliance_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    compliance_grace_deadline: Mapped[object | None] = mapped_column(DateTime, nullable=True)

    base_currency: Mapped[str] = mapped_column(
        String(10),
        default="USD",
        nullable=False,
        comment="Merchant's pricing & settlement currency (binding under POD)",
    )

    # ── Storefront Feature Toggles ───────────────────────────────
    # Per-store switches for optional storefront sections. A merchant can
    # hide any of these so empty/irrelevant sections never render.
    show_wishlist: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_newsletter: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_testimonials: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_recently_viewed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_currency_converter: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    show_brand_showcase: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    show_trust_bar:     Mapped[bool] = mapped_column(Boolean, default=True,  nullable=False)

    # ── Homepage Section Toggles ─────────────────────────────────
    hero_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    featured_categories_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    trending_products_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    best_sellers_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    promo_banner_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ── Future AI Features ───────────────────────────────────────
    ai_assistant_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    personalization_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Contact / Social ─────────────────────────────────────────
    # Seller WhatsApp number for direct customer contact
    whatsapp: Mapped[str | None] = mapped_column(String(30), nullable=True)
    # Seller Instagram handle e.g. luxethreads (stored without the @)
    instagram: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # JSON array of category names e.g. '["Fashion","Electronics"]'
    categories: Mapped[str] = mapped_column(Text, default="[]", nullable=False)

    # ── Discount Popup (lead capture) ────────────────────────────
    popup_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    popup_discount: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    popup_message: Mapped[str] = mapped_column(
        String(200), default="Get a discount on your order!", nullable=False
    )

        # Delivery fee settings
    delivery_fee: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    free_delivery_above: Mapped[float] = mapped_column(Numeric(12, 2), default=10000, nullable=False)

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