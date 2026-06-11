"""
app/api/routes/auth.py
───────────────────────
Authentication API routes for Sellora.

Endpoints:
    POST /api/auth/signup          → Create new account with email/password
    POST /api/auth/login           → Login with email/password
    POST /api/auth/google          → Login or signup with Google OAuth
    GET  /api/auth/me              → Get current logged-in user (protected)
    POST /api/auth/forgot-password → Send password reset email
    POST /api/auth/reset-password  → Set new password using reset token

All successful auth endpoints return a TokenResponse containing:
- access_token  (use for API requests)
- refresh_token (use to get new access token)
- user          (display in dashboard)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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

# Create the auth router — all routes are prefixed with /auth
# The full prefix becomes /api/auth (set in main.py)
router = APIRouter(prefix="/auth", tags=["Authentication"])


def make_token_response(user: User) -> TokenResponse:
    """
    Helper that builds the standard auth response for any login method.
    Called after successful signup, login, or Google auth.

    Creates both tokens and packages them with safe user data.
    This avoids repeating the same code in every auth endpoint.
    """
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserOut.model_validate(user),
    )


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=201,  # 201 Created (not 200 OK) for new resource creation
    summary="Create a new seller account",
)
async def signup(
    payload: SignupRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new seller account with email and password.

    Steps:
    1. Check if email is already taken
    2. Hash the password with bcrypt
    3. Create the user record
    4. Return tokens so user is immediately logged in

    Returns 409 Conflict if email already exists.
    """
    # Check if someone already has this email
    result = await db.execute(
        select(User).where(User.email == payload.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Create the user — password is hashed, never stored as plain text
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        auth_provider="email",
        is_verified=False,  # Email not verified yet
    )
    db.add(user)

    # flush() sends SQL to DB without committing
    # This gives us the generated ID before the transaction commits
    await db.flush()
    await db.refresh(user)  # Load generated fields (id, created_at)

    # Return tokens — user is logged in immediately after signup
    return make_token_response(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with email and password",
)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate a seller with their email and password.

    Security note: We return the same error message for both
    'email not found' and 'wrong password' cases.
    This prevents attackers from discovering which emails
    are registered (user enumeration attack).
    """
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == payload.email)
    )
    user = result.scalar_one_or_none()

    # Reject if user doesn't exist OR if they signed up with Google
    # (Google users have no password_hash so can't use this endpoint)
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify the password against the stored bcrypt hash
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Reject deactivated accounts (soft-deleted users)
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    return make_token_response(user)


@router.post(
    "/google",
    response_model=TokenResponse,
    summary="Login or signup with Google OAuth",
)
async def google_auth(
    payload: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate using a Google access token from the frontend.

    Returns token + user + is_new_user flag so frontend knows
    whether to redirect to dashboard or onboarding.
    """
    # Step 1: Verify the Google token
    google_user = await verify_google_token(payload.token)
    if not google_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    is_new_user = False

    # Step 2: Find existing account by Google ID
    result = await db.execute(
        select(User).where(User.google_id == google_user["id"])
    )
    user = result.scalar_one_or_none()

    if not user:
        # Step 3: Find by email
        result = await db.execute(
            select(User).where(User.email == google_user["email"])
        )
        user = result.scalar_one_or_none()

        if user:
            # Link Google ID to existing email account
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
                is_verified=google_user.get("email_verified", False),
            )
            db.add(user)
            await db.flush()
            await db.refresh(user)

    # Step 4: Check if user has a store
    from app.models.store import Store
    store_result = await db.execute(
        select(Store).where(Store.user_id == user.id)
    )
    has_store = store_result.scalar_one_or_none() is not None

    # Build response with extra flags
    token_response = make_token_response(user)

    # Add redirect hint to response
    # frontend uses this to decide where to go
    response_data = token_response.model_dump()
    response_data["is_new_user"] = is_new_user
    response_data["has_store"] = has_store

    return response_data

@router.get(
    "/me",
    response_model=UserOut,
    summary="Get current logged-in user",
)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the profile of the currently authenticated user.

    Protected route — requires valid Bearer token in header.
    Used by the frontend on app load to restore the session.
    """
    return UserOut.model_validate(current_user)


@router.post(
    "/forgot-password",
    summary="Send password reset email",
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger a password reset email for the given email address.

    Security: Always returns success even if email doesn't exist.
    This prevents attackers from discovering registered emails
    by trying different addresses (email enumeration attack).

    Only sends email if:
    - Account exists with that email
    - Account uses email/password auth (not Google-only)
    """
    result = await db.execute(
        select(User).where(User.email == payload.email)
    )
    user = result.scalar_one_or_none()

    # Only send email if account exists and has a password
    # (Google-only users can't reset a password they never had)
    if user and user.password_hash:
        token = create_reset_token(user.email)
        await send_password_reset_email(user.email, token)

    # Always return the same message regardless of whether
    # the email exists — prevents user enumeration
    return {
        "message": "If this email exists, a reset link has been sent"
    }


@router.post(
    "/reset-password",
    summary="Set new password using reset token",
)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Set a new password using the token from the reset email.

    The token is a JWT that:
    - Contains the user's email as the subject
    - Expires after 1 hour
    - Has type "reset" to prevent other tokens being used

    Returns 400 if token is invalid, expired, or already used.
    """
    # Verify the reset token and extract the email
    email = verify_reset_token(payload.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    # Find the user associated with this email
    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Hash and save the new password
    user.password_hash = hash_password(payload.new_password)
    await db.flush()

    return {"message": "Password reset successfully"}


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
    Allows a logged-in email/password user to change their password.
    Requires current password for verification.
    Not available for Google OAuth users.
    """
    # Google users have no password to change
    if not current_user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account users cannot change password here.",
        )

    # Verify current password
    if not verify_password(payload.get("current_password", ""), current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    # Set new password
    current_user.password_hash = hash_password(payload.get("new_password", ""))
    await db.flush()

    return {"message": "Password changed successfully"}

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