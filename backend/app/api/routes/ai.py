"""
backend/app/api/routes/ai.py
──────────────────────────────
AI Tools powered by Claude — Pro plan required.

Endpoints:
    POST /api/ai/generate — generate AI content (reply, FAQ, promo)
"""

from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["AI Tools"])


def user_is_pro(user: User) -> bool:
    """Check if user has an active Pro subscription."""
    return (
        user.plan == "pro" and
        user.plan_expires_at is not None and
        user.plan_expires_at > datetime.now(timezone.utc)
    )


@router.post(
    "/generate",
    summary="Generate AI content (Pro only)",
)
async def generate_ai_content(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """
    Generate AI content using Claude.
    Pro plan required. API key stays on the server — never exposed.
    """
    # ── Pro plan enforcement ──────────────────────────────────────
    if not user_is_pro(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Tools are a Pro feature. Upgrade to unlock Claude-powered tools.",
        )

    # ── Check API key is configured ───────────────────────────────
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Tools are coming soon! We're putting the finishing touches on this feature.",
        )

    # Temporarily disabled while Gemini billing/quota is being set up.
    # Remove this block once GEMINI_API_KEY has active quota.
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="AI Tools are coming soon! We're putting the finishing touches on this feature.",
    )

    prompt = payload.get("prompt", "")
    if not prompt or len(prompt) > 4000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt is required and must be under 4000 characters.",
        )

    # ── Call Gemini API from the backend ──────────────────────────
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}",
            headers={"content-type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"maxOutputTokens": 1024, "temperature": 0.7},
            },
        )

    if res.status_code != 200:
        print(f"❌ Gemini API error {res.status_code}: {res.text}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI generation failed. Please try again.",
        )

    data = res.json()
    text = ""
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        text = "No response generated."
    return {"text": text}