"""
app/schemas/store.py
─────────────────────
Pydantic schemas for store request/response validation.

Follows the same pattern as schemas/auth.py:
- REQUEST schemas  — validate incoming data from the frontend
- RESPONSE schemas — define exactly what data is sent back
"""

from datetime import datetime
from pydantic import BaseModel, Field, field_validator
import re


# ── Request Schemas ───────────────────────────────────────────────

class StoreSetupRequest(BaseModel):
    """
    Data required to create a store during onboarding (Step 2).
    Sent from POST /api/store/setup.
    """
    store_name: str = Field(..., min_length=1, max_length=150)
    slug: str       = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=1000)
    popup_enabled:  bool | None = None
    popup_discount: int | None = Field(None, ge=1, le=90)
    popup_message:  str | None = Field(None, max_length=200)

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """
        Enforce URL-safe slug format.
        Only lowercase letters, numbers, and hyphens allowed.
        No leading/trailing hyphens.
        """
        v = v.lower().strip()
        if not re.match(r'^[a-z0-9]+(?:-[a-z0-9]+)*$', v):
            raise ValueError(
                "Slug may only contain lowercase letters, numbers, and hyphens. "
                "Cannot start or end with a hyphen."
            )
        return v

    @field_validator("store_name")
    @classmethod
    def validate_store_name(cls, v: str) -> str:
        return v.strip()

    """
    Store customization settings.

    These settings allow merchants to control the appearance
    and behavior of their storefront without requiring code
    changes or theme modifications.

    Includes:

    - Branding configuration
    - Theme selection
    - Currency settings
    - Storefront feature toggles
    - Homepage section visibility
    """
class StoreUpdateRequest(BaseModel):
    """
    Data for updating store details from Store Settings page.
    All fields optional — only send what changed.
    """
    store_name:  str | None = Field(None, min_length=1, max_length=150)
    description: str | None = Field(None, max_length=1000)
    logo_url:    str | None = Field(None, max_length=500)
    banner_url:  str | None
    banner_type: str
    category_type: str = Field(None, max_length=500)
    banner_type: str
    category_type: str | None = Field(None, max_length=10)
    category_type: str | None = Field(None, max_length=30)
    theme_color: str | None = Field(None, max_length=20)
    whatsapp:    str | None = Field(None, max_length=30)
    instagram:   str | None = Field(None, max_length=100)
    categories:  str | None = None
    popup_enabled:  bool | None = None
    popup_discount: int | None = Field(None, ge=1, le=90)
    popup_message:  str | None = Field(None, max_length=200)
    delivery_fee: float | None = None
    free_delivery_above:float | None = None
    # ── Store Branding ──────────────────────────────────────────────

    primary_color: str | None = Field(
        None,
        max_length=20,
        description="Primary storefront color"
    )

    secondary_color: str | None = Field(
        None,
        max_length=20,
        description="Secondary storefront color"
    )

    accent_color: str | None = Field(
        None,
        max_length=20,
        description="CTA and highlight color"
    )

    theme: str | None = Field(
        None,
        max_length=50,
        description="Storefront theme preset"
    )

    base_currency: str | None = Field(
        None,
        max_length=10,
        description="Store's default currency"
    )

    # ── Storefront Features ─────────────────────────────────────────

    show_wishlist: bool | None = None

    show_newsletter: bool | None = None

    show_testimonials: bool | None = None

    show_recently_viewed: bool | None = None

    show_currency_converter: bool | None = None
    show_brand_showcase: bool | None = None
    show_trust_bar:     bool | None = None

    # ── Homepage Sections ───────────────────────────────────────────

    hero_enabled: bool | None = None

    featured_categories_enabled: bool | None = None

    trending_products_enabled: bool | None = None

    best_sellers_enabled: bool | None = None

    promo_banner_enabled: bool | None = None


# ── Response Schemas ──────────────────────────────────────────────
    """
    Complete storefront configuration returned to the frontend.

    Used by:

    - Dashboard Settings
    - Merchant Storefront Preview
    - Public Storefront Rendering

    Provides all branding, appearance, currency,
    and feature-toggle settings required to build
    a dynamic storefront experience.
    """
class StoreOut(BaseModel):
    """
    Store data returned to the frontend.
    Used in dashboard header, storefront, and settings.
    """
    id:          str
    user_id:     str
    store_name:  str
    slug:        str
    description: str | None
    logo_url:    str | None
    is_active:   bool
    created_at:  datetime
    updated_at:  datetime
    banner_url:  str | None
    banner_type: str
    category_type: str
    theme_color: str
    whatsapp:    str | None
    instagram:   str | None
    categories:  str
    popup_enabled:  bool
    popup_discount: int
    popup_message:  str
    delivery_fee:   float
    free_delivery_above:float
    # ── Store Branding ──────────────────────────────────────────────

    primary_color: str

    secondary_color: str

    accent_color: str

    theme: str

    base_currency: str

    # ── Storefront Features ─────────────────────────────────────────

    show_wishlist: bool

    show_newsletter: bool

    show_testimonials: bool

    show_recently_viewed: bool

    show_currency_converter: bool

    show_brand_showcase: bool
    show_trust_bar:     bool

    # ── Homepage Sections ───────────────────────────────────────────

    hero_enabled: bool

    featured_categories_enabled: bool

    trending_products_enabled: bool

    best_sellers_enabled: bool

    promo_banner_enabled: bool

    # Computed field — full public URL for sharing
    @property
    def store_url(self) -> str:
        return f"https://kormerce.io/{self.slug}"

    model_config = {"from_attributes": True}