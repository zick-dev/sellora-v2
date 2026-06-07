"""
app/models/user.py
───────────────────
SQLAlchemy model for the users table.

Supports two authentication methods:
1. Email/Password — traditional signup with hashed password
2. Google OAuth   — signup/login via Google account

For Google users, password_hash is NULL since they never
set a password. The google_id field links them to their
Google account for future logins.

Relationships:
- One user → One store (created during onboarding)
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    """
    Represents a seller account on Sellora.

    Each user can:
    - Sign up with email/password or Google OAuth
    - Create one store during onboarding
    - Manage products, orders, and AI tools
    """

    __tablename__ = "users"

    # ── Primary Key ──────────────────────────────────────────────
    # UUID instead of integer ID — more secure (can't enumerate users)
    # and works better in distributed systems
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),   # Store as string, not Python UUID object
        primary_key=True,
        default=lambda: str(uuid.uuid4()),  # Auto-generate on creation
        index=True,            # Index for fast lookups by ID
    )

    # ── Basic Info ───────────────────────────────────────────────
    # Seller's display name shown in the dashboard
    name: Mapped[str] = mapped_column(String(150), nullable=False)

    # Email is the primary identifier — must be unique across all users
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,    # No two users can share an email
        nullable=False,
        index=True,     # Index for fast login lookups
    )

    # ── Authentication ───────────────────────────────────────────
    # Bcrypt-hashed password. NULL for Google OAuth users who
    # never set a password through our system.
    password_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="Null for Google OAuth users"
    )

    # URL to the user's profile photo (from Google or uploaded)
    avatar_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    # Google's unique user identifier — used to match returning
    # Google users to their existing Sellora account
    google_id: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,    # Each Google account links to one Sellora account
        nullable=True,  # NULL for email/password users
        index=True,     # Index for fast Google login lookups
    )

    # Tracks how the user originally signed up
    # Values: "email" or "google"
    auth_provider: Mapped[str] = mapped_column(
        String(20),
        default="email",
        nullable=False,
        comment="email | google"
    )

    # ── Status Flags ─────────────────────────────────────────────
    # Soft delete — deactivated users can't log in but data is preserved
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # True for Google users (Google verifies emails) and
    # email users who clicked the verification link
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # ── Timestamps ───────────────────────────────────────────────
    # When the account was created — stored in UTC for consistency
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Auto-updates whenever the record is modified
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        """Human-readable representation for debugging"""
        return f"<User id={self.id} email={self.email}>"