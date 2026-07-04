"""
app/core/config.py
──────────────────
Central configuration for the entire Kormerce backend.
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
    FROM_EMAIL: str = "security@kormerce.io"

    # ── Flutterwave Payment Gateway ───────────────────────────────
    # Used for handling subscription payments
    FLUTTERWAVE_PUBLIC_KEY: str = "b78a7a80-e29e-48ab-b493-df3fdabe4f33"
    FLUTTERWAVE_SECRET_KEY: str = "dV4cg3ilUxaDXl2ZvyJG4FzYp3lPsGV0"
    FLUTTERWAVE_ENCRYPTION_KEY: str    = "tK9La1qAUBVppfgzmC6YtYygyVrHlPQaW06un3jyeVE="  # For encrypting sensitive data in requests
    FLUTTERWAVE_WEBHOOK_SECRET: str = "kormerce_webhook_secret"  # Secret used to verify incoming webhook signatures from Flutterwave


    # ── Anthropic AI ─────────────────────────────────────────────
    # Claude API key for AI reply suggestions, FAQ generation etc.
    # Optional — AI features are disabled if not provided
    GEMINI_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    FRONTEND_URL: str = "https://sellora-v2-blue.vercel.app"

    # Cloudinary — used server-side to delete images on account deletion
    CLOUDINARY_CLOUD_NAME: str = "dkun9hvkf"
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Exchange rate API — used for currency conversion on storefront and at checkout
    EXCHANGE_RATE_API_KEY: str = ""

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