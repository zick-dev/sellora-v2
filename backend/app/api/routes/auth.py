"""
app/api/routes/auth.py
───────────────────────
Authentication API routes for Sellora.

Endpoints:
    POST /api/auth/signup          → Create new account with email/password
    POST /api/auth/login           → Login with email/password
    POST /api/auth/google          → Login or signup with Google OAuth
    GET  /api/auth/me              → Get current logged-in user (protected)
    PUT  /api/auth/me              → Update current user profile
    POST /api/auth/forgot-password → Send password reset email
    POST /api/auth/reset-password  → Set new password using reset token
    PUT  /api/auth/change-password → Change password for logged-in user
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_reset_token,
    hash_password,
    verify_password,
    verify_reset_token,
    get_current_user,
)
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleAuthRequest,
    LoginRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
    UserOut,
)
from app.services.email_service import send_password_reset_email
from app.services.google_auth_service import verify_google_token



# Rate limiter — limits requests per IP address
limiter = Limiter(key_func=get_remote_address)

# Create the auth router
router = APIRouter(prefix="/auth", tags=["Authentication"])


def make_token_response(user: User) -> TokenResponse:
    """Build standard auth response after any successful login."""
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserOut.model_validate(user),
    )


# ── POST /api/auth/signup ─────────────────────────────────────────
@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=201,
    summary="Create a new seller account",
)
@limiter.limit("3/minute")
async def signup(
    request: Request,
    payload: SignupRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new seller account with email and password.
    Rate limited to 3 signups per minute per IP.
    """
    result = await db.execute(
        select(User).where(User.email == payload.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        auth_provider="email",
        plan="pro",
        plan_expires_at=datetime.now(timezone.utc) + timedelta(days=21),
        is_verified=False,

    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return make_token_response(user)


# ── POST /api/auth/login ──────────────────────────────────────────
@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with email and password",
)
@limiter.limit("5/minute")
async def login(
    request: Request,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate with email and password.
    Rate limited to 5 attempts per minute per IP — brute force protection.
    Same error for wrong email and wrong password — prevents user enumeration.
    """
    result = await db.execute(
        select(User).where(User.email == payload.email)
    )
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    return make_token_response(user)


# ── POST /api/auth/google ─────────────────────────────────────────
@router.post(
    "/google",
    response_model=TokenResponse,
    summary="Login or signup with Google OAuth",
)
@limiter.limit("10/minute")
async def google_auth(
    request: Request,
    payload: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate using a Google access token from the frontend.
    Creates account if new user, logs in if existing user.
    Returns has_store flag so frontend knows where to redirect.
    """
    google_user = await verify_google_token(payload.token)
    if not google_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    is_new_user = False

    # Find by Google ID first (fastest)
    result = await db.execute(
        select(User).where(User.google_id == google_user["id"])
    )
    user = result.scalar_one_or_none()

    if not user:
        # Find by email (handles existing email users)
        result = await db.execute(
            select(User).where(User.email == google_user["email"])
        )
        user = result.scalar_one_or_none()

        if user:
            # Link Google ID to existing account
            user.google_id = google_user["id"]
            user.avatar_url = google_user.get("picture")
            await db.flush()
        else:
            # Brand new user
            is_new_user = True
            user = User(
                name=google_user["name"],
                email=google_user["email"],
                google_id=google_user["id"],
                avatar_url=google_user.get("picture"),
                auth_provider="google",
                plan="pro",
                plan_expires_at=datetime.now(timezone.utc) + timedelta(days=21),
                is_verified=google_user.get("email_verified", False),
            )
            db.add(user)
            await db.flush()
            await db.refresh(user)

    # Check if user has a store
    from app.models.store import Store
    store_result = await db.execute(
        select(Store).where(Store.user_id == user.id)
    )
    has_store = store_result.scalar_one_or_none() is not None

    response_data = make_token_response(user).model_dump()
    response_data["is_new_user"] = is_new_user
    response_data["has_store"] = has_store
    return response_data


# ── GET /api/auth/me ──────────────────────────────────────────────
@router.get(
    "/me",
    response_model=UserOut,
    summary="Get current logged-in user",
)
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the profile of the currently authenticated user."""
    return UserOut.model_validate(current_user)


# ── PUT /api/auth/me ──────────────────────────────────────────────
@router.put(
    "/me",
    response_model=UserOut,
    summary="Update current user profile",
)
async def update_me(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the logged-in user's name."""
    if payload.get("name"):
        current_user.name = payload["name"].strip()
    await db.flush()
    await db.refresh(current_user)
    return UserOut.model_validate(current_user)


# ── POST /api/auth/forgot-password ───────────────────────────────
@router.post(
    "/forgot-password",
    summary="Send password reset email",
)
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Send password reset email.
    Always returns success to prevent email enumeration.
    Rate limited to 3 per minute per IP.
    """
    result = await db.execute(
        select(User).where(User.email == payload.email)
    )
    user = result.scalar_one_or_none()

    if user and user.password_hash:
        token = create_reset_token(user.email)
        await send_password_reset_email(user.email, token)

    return {"message": "If this email exists, a reset link has been sent"}


# ── POST /api/auth/reset-password ────────────────────────────────
@router.post(
    "/reset-password",
    summary="Set new password using reset token",
)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Set a new password using the token from the reset email."""
    email = verify_reset_token(payload.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.password_hash = hash_password(payload.new_password)
    await db.flush()
    return {"message": "Password reset successfully"}


# ── PUT /api/auth/change-password ────────────────────────────────
@router.put(
    "/change-password",
    summary="Change password for logged-in user",
)
async def change_password(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Change password for logged-in email/password users.
    Not available for Google OAuth users.
    Requires current password verification.
    """
    if not current_user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account users cannot change password here.",
        )

    if not verify_password(
        payload.get("current_password", ""),
        current_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    current_user.password_hash = hash_password(payload.get("new_password", ""))
    await db.flush()
    return {"message": "Password changed successfully"}