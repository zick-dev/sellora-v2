"""
app/core/config.py
──────────────────
Central configuration for the entire Sellora backend.
All environment variables are loaded from the .env file
and validated automatically by Pydantic on startup.
If any required variable is missing, the app will refuse to start.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """
    All settings are read from the .env file.
    Pydantic validates types automatically — if DATABASE_URL
    is missing or wrong type, it raises an error immediately.
    """

    # ── Database ────────────────────────────────────────────────
    # Full async PostgreSQL connection string
    # Format: postgresql+asyncpg://user:password@host:port/dbname
    DATABASE_URL: str

    # ── JWT Authentication ───────────────────────────────────────
    # Secret key used to sign and verify JWT tokens.
    # Must be kept private — anyone with this can forge tokens.
    SECRET_KEY: str

    # Hashing algorithm for JWT — HS256 is the industry standard
    ALGORITHM: str = "HS256"

    # How long access tokens are valid (short-lived for security)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # How long refresh tokens are valid (long-lived for convenience)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Google OAuth ─────────────────────────────────────────────
    # Get these from Google Cloud Console → APIs → Credentials
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    # ── Email Service (Resend) ───────────────────────────────────
    # Used for sending password reset emails
    # Get API key from resend.com dashboard
    RESEND_API_KEY: str

    # The sender email shown in password reset emails
    FROM_EMAIL: str = "security@sellora.io"

    # ── Anthropic AI ─────────────────────────────────────────────
    # Claude API key for AI reply suggestions, FAQ generation etc.
    # Optional — AI features are disabled if not provided
    ANTHROPIC_API_KEY: str = ""

    # ── App Configuration ────────────────────────────────────────
    # List of frontend URLs allowed to make requests to this API
    # Add production URL here when deploying
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Controls debug mode and logging verbosity
    APP_ENV: str = "development"
    DEBUG: bool = True

    class Config:
        # Tell Pydantic where to find the environment variables
        env_file = ".env"

        # Don't crash if .env has extra variables we don't use
        extra = "ignore"


# Create a single global instance used throughout the app
# Import this wherever you need a config value:
# from app.core.config import settings
settings = Settings()