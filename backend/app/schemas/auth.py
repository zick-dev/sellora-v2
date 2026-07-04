"""
app/schemas/auth.py
────────────────────
Pydantic schemas for authentication request/response validation.

Schemas serve two purposes:
1. REQUEST schemas  — validate incoming data from the frontend
   (wrong types, missing fields, invalid email format etc.)
2. RESPONSE schemas — define exactly what data is sent back
   (prevents accidentally leaking password_hash, google_id etc.)

FastAPI uses these automatically:
- Request body is parsed and validated against the schema
- Response is serialized using the response_model schema
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr


# ── Request Schemas (incoming from frontend) ─────────────────────

class SignupRequest(BaseModel):
    """
    Data required to create a new email/password account.
    EmailStr validates the email format automatically.
    """
    name: str        # Seller's full name
    email: EmailStr  # Validated email format (pydantic checks this)
    password: str    # Plain text — will be hashed before storage
    referral_code: str | None = None  # Optional referrer's code


class LoginRequest(BaseModel):
    """
    Data required to log in with email and password.
    """
    email: EmailStr  # Must be a valid email format
    password: str    # Plain text — compared against stored hash


class GoogleAuthRequest(BaseModel):
    """
    Data sent when user clicks 'Continue with Google'.
    The frontend uses Google's OAuth library to get this token,
    then sends it here for backend verification.
    """
    token: str  # Google ID token from the frontend OAuth flow


class ForgotPasswordRequest(BaseModel):
    """
    Data required to trigger a password reset email.
    Only email is needed — we find the account and send the link.
    """
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """
    Data required to set a new password.
    Token comes from the URL in the reset email link.
    """
    token: str        # JWT reset token from the email link
    new_password: str # The new password the user wants to set


# ── Response Schemas (outgoing to frontend) ───────────────────────

class UserOut(BaseModel):
    """
    Safe user data returned to the frontend.
    Deliberately excludes: password_hash, google_id, is_active
    — these are internal fields the frontend doesn't need.
    """
    id: str
    name: str
    email: str
    avatar_url: str | None    # Profile photo URL (from Google or upload)
    auth_provider: str        # "email" or "google" — affects UI display
    is_verified: bool         # Shows verification badge in UI
    plan:           str
    plan_expires_at: datetime | None
    referral_code:  str | None = None

    # from_attributes=True allows creating this from a SQLAlchemy model
    # e.g. UserOut.model_validate(user_db_object)
    model_config = {"from_attributes": True}


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    """
    Returned after successful login, signup, or Google auth.

    The frontend stores:
    - access_token  → sent with every API request
    - refresh_token → used to get new access token when expired
    - user          → displayed in dashboard header
    """
    access_token: str   # Short-lived JWT (30 minutes)
    refresh_token: str  # Long-lived JWT (7 days)
    token_type: str = "bearer"  # Always "bearer" — HTTP standard
    user: UserOut       # User data to display immediately after login


# Rebuild needed because TokenResponse references UserOut
# which is defined after it — this resolves the forward reference
TokenResponse.model_rebuild()