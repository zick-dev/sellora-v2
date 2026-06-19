"""
app/core/security.py
─────────────────────
All authentication and security utilities for Sellora.

Covers:
- Password hashing and verification using bcrypt
- JWT token creation (access, refresh, password reset)
- JWT token verification
- FastAPI dependency for getting the currently logged-in user

Token types:
- access_token  → short-lived (30 min), used for API requests
- refresh_token → long-lived (7 days), used to get new access token
- reset_token   → 1 hour, used only for password reset flow
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db

# bcrypt is the industry standard for password hashing.
# It's intentionally slow to make brute-force attacks expensive.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTPBearer reads the JWT token from the Authorization header.
# Expected format: Authorization: Bearer <token>
bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    # bcrypt has a 72-byte limit — truncate to prevent errors
    return pwd_context.hash(password[:72])


def verify_password(plain: str, hashed: str) -> bool:
    # Truncate here too so verification matches hashing
    return pwd_context.verify(plain[:72], hashed)

def create_access_token(user_id: str) -> str:
    """
    Create a short-lived JWT access token for a user.

    The token payload contains:
    - sub: the user's ID (standard JWT claim for subject)
    - exp: expiry timestamp (30 minutes from now)
    - type: "access" — prevents refresh tokens being used as access tokens

    This token is sent with every API request in the Authorization header.
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "access"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_refresh_token(user_id: str) -> str:
    """
    Create a long-lived JWT refresh token for a user.

    Used to obtain a new access token when the current one expires,
    without requiring the user to log in again.

    Stored securely in the frontend (httpOnly cookie recommended
    for production, localStorage for development).
    """
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "refresh"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_reset_token(email: str) -> str:
    """
    Create a one-time password reset token valid for 1 hour.

    Note: Uses email as the subject (not user ID) so we can
    look up the user by email when they click the reset link.

    This token is sent in the password reset email as a URL parameter:
    https://sellora.com/reset-password?token=<this_token>
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    return jwt.encode(
        {"sub": email, "exp": expire, "type": "reset"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def verify_refresh_token(token: str) -> Optional[str]:
    """
    Verify a refresh token and return the user_id it was created for.
    Returns:
        str: the user_id if token is valid, not expired, and type=refresh
        None: if token is invalid, expired, or wrong type
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "refresh":
            return None
        return payload.get("sub")
    except JWTError:
        return None


def verify_reset_token(token: str) -> Optional[str]:
    """
    Verify a password reset token and return the email it was created for.

    Returns:
        str: the email address if token is valid and not expired
        None: if token is invalid, expired, or wrong type

    The type check prevents access/refresh tokens being used
    as reset tokens (defense in depth).
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        # Ensure this is specifically a reset token, not any JWT
        if payload.get("type") != "reset":
            return None
        return payload.get("sub")  # Returns the email
    except JWTError:
        # Token is expired, malformed, or signature is invalid
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    FastAPI dependency that extracts and validates the logged-in user.

    How it works:
    1. Reads the JWT from the Authorization: Bearer <token> header
    2. Decodes and validates the token signature and expiry
    3. Extracts the user ID from the token payload
    4. Fetches the user from the database
    5. Returns the User object if everything is valid

    Usage in protected routes:
        async def protected_route(
            current_user: User = Depends(get_current_user)
        ):

    Raises HTTP 401 if token is missing, invalid, or expired.
    """
    # Standard error returned for any authentication failure.
    # We use a generic message to avoid leaking information.
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode the JWT and extract the payload
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        # Extract user ID and verify this is an access token
        user_id: str = payload.get("sub")
        if not user_id or payload.get("type") != "access":
            raise credentials_exception

    except JWTError:
        # Token is malformed, expired, or signature doesn't match
        raise credentials_exception

    # Look up the user in the database using the ID from the token
    from app.models.user import User
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    # Reject if user doesn't exist or has been deactivated
    if not user or not user.is_active:
        raise credentials_exception

    return user  # This becomes the `current_user` parameter in routes