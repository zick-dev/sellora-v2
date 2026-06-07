"""
app/services/google_auth_service.py
─────────────────────────────────────
Google OAuth token verification service.

How Google OAuth works in Sellora:
1. Frontend uses @react-oauth/google to get an ID token
   (this happens entirely in the browser via Google's SDK)
2. Frontend sends the ID token to POST /api/auth/google
3. This service verifies the token with Google's servers
4. If valid, we extract the user info and create/find the account

Why verify server-side?
- The token could be tampered with or forged
- Google's tokeninfo endpoint confirms it's genuinely from Google
- We also verify it was issued for OUR app (aud check)

Security checks performed:
- Token signature is valid (Google's servers confirm this)
- Token was issued for our specific Google Client ID
- Token has not expired
"""

import httpx
from app.core.config import settings


async def verify_google_token(token: str) -> dict | None:
    """
    Verify a Google ID token and extract user information.

    Args:
        token: The Google ID token received from the frontend

    Returns:
        dict with user info if token is valid:
            {
                "id": "google_user_id",
                "email": "user@gmail.com",
                "name": "John Doe",
                "picture": "https://...",
                "email_verified": True
            }
        None if token is invalid, expired, or not for our app

    The verification is done by calling Google's tokeninfo endpoint
    which is the simplest and most reliable verification method.
    """
    try:
        # Use httpx for async HTTP requests to Google's API
        async with httpx.AsyncClient() as client:

            # Google's tokeninfo endpoint validates the token and
            # returns the decoded payload if everything is valid
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo"
                f"?id_token={token}"
            )

            # Non-200 means the token is invalid or expired
            if response.status_code != 200:
                print(f"❌ Google token rejected: {response.status_code}")
                return None

            data = response.json()

            # CRITICAL SECURITY CHECK:
            # Verify this token was issued for OUR Google Client ID.
            # Without this check, tokens from other apps could be used
            # to log into Sellora (confused deputy attack).
            if data.get("aud") != settings.GOOGLE_CLIENT_ID:
                print("❌ Google token audience mismatch — wrong app")
                return None

            # Check if Google returned an error in the response body
            if "error_description" in data:
                print(f"❌ Google token error: {data['error_description']}")
                return None

            # Extract and return the verified user information
            return {
                "id": data.get("sub"),        # Google's unique user ID
                "email": data.get("email"),   # User's Gmail address
                "name": data.get("name"),     # Full display name
                "picture": data.get("picture"),  # Profile photo URL
                # True if Google has verified this email address
                "email_verified": data.get("email_verified") == "true",
            }

    except Exception as e:
        # Network error, timeout, or unexpected response format
        print(f"❌ Google token verification error: {e}")
        return None