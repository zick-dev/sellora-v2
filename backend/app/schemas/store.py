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


class StoreUpdateRequest(BaseModel):
    """
    Data for updating store details from Store Settings page.
    All fields optional — only send what changed.
    """
    store_name:  str | None = Field(None, min_length=1, max_length=150)
    description: str | None = Field(None, max_length=1000)
    logo_url:    str | None = Field(None, max_length=500)


# ── Response Schemas ──────────────────────────────────────────────

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

    # Computed field — full public URL for sharing
    @property
    def store_url(self) -> str:
        return f"https://sellora.io/{self.slug}"

    model_config = {"from_attributes": True}