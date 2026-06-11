"""
app/services/google_auth_service.py
─────────────────────────────────────
Google OAuth token verification service.

We use the access token (not ID token) because @react-oauth/google
returns an access token by default. We verify it by calling
Google's userinfo endpoint directly.
"""

import httpx
from app.core.config import settings


async def verify_google_token(token: str) -> dict | None:
    """
    Verify a Google access token and extract user information
    by calling Google's userinfo endpoint.

    Args:
        token: The Google access token from the frontend

    Returns:
        dict with user info if valid, None if invalid
    """
    try:
        async with httpx.AsyncClient() as client:
            # Use userinfo endpoint with access token in header
            response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"},
            )

            if response.status_code != 200:
                print(f"❌ Google userinfo failed: {response.status_code}")
                return None

            data = response.json()

            # Check for error in response
            if "error" in data:
                print(f"❌ Google userinfo error: {data['error']}")
                return None

            return {
                "id":             data.get("sub"),
                "email":          data.get("email"),
                "name":           data.get("name"),
                "picture":        data.get("picture"),
                "email_verified": data.get("email_verified", False),
            }

    except Exception as e:
        print(f"❌ Google token verification error: {e}")
        return None