"""
app/api/routes/subscription.py
────────────────────────────────
Subscription management routes for Kormerce Pro.

Endpoints:
    GET  /api/subscription/status     → Get current plan status
    POST /api/subscription/verify     → Verify Flutterwave payment
    POST /api/subscription/webhook    → Flutterwave webhook handler
"""

import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/subscription", tags=["Subscription"])

PRO_PRICE_NGN = 5000  # ₦5,000/month
PRO_DURATION_DAYS = 30


def is_pro(user: User) -> bool:
    """Check if user has active Pro plan."""
    if user.plan != "pro":
        return False
    if not user.plan_expires_at:
        return False
    return user.plan_expires_at > datetime.now(timezone.utc)


# ── GET /api/subscription/status ─────────────────────────────────
@router.get("/status")
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
):
    """Get current subscription status for logged-in user."""
    pro = is_pro(current_user)
    return {
        "plan":        current_user.plan or "free",
        "is_pro":      pro,
        "expires_at":  current_user.plan_expires_at.isoformat() if current_user.plan_expires_at else None,
        "days_left":   (current_user.plan_expires_at - datetime.now(timezone.utc)).days if pro else 0,
    }


# ── POST /api/subscription/verify ────────────────────────────────
@router.post("/verify")
async def verify_payment(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Verify a Flutterwave payment and upgrade user to Pro.
    Called by frontend after successful payment.
    """
    transaction_id = payload.get("transaction_id")
    tx_ref = payload.get("tx_ref")

    if not transaction_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction ID is required",
        )

    # Verify with Flutterwave API
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://api.flutterwave.com/v3/transactions/{transaction_id}/verify",
            headers={
                "Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}",
                "Content-Type": "application/json",
            },
        )

    if res.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed",
        )

    data = res.json()

    # Check payment was successful
    if data.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment was not successful",
        )

    tx_data = data.get("data", {})

    # Verify amount paid is correct
    amount_paid = tx_data.get("amount", 0)
    currency    = tx_data.get("currency", "")

    if currency != "NGN" or amount_paid < PRO_PRICE_NGN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment amount",
        )

    # Upgrade user to Pro
    now = datetime.now(timezone.utc)

    # Extend existing subscription if still active
    if current_user.plan == "pro" and current_user.plan_expires_at and current_user.plan_expires_at > now:
        current_user.plan_expires_at = current_user.plan_expires_at + timedelta(days=PRO_DURATION_DAYS)
    else:
        current_user.plan_expires_at = now + timedelta(days=PRO_DURATION_DAYS)

    current_user.plan = "pro"
    current_user.flutterwave_tx_ref = tx_ref or str(transaction_id)

    await db.flush()
    await db.refresh(current_user)

    return {
        "message":    "Successfully upgraded to Kormerce Pro!",
        "plan":       "pro",
        "expires_at": current_user.plan_expires_at.isoformat(),
        "days_left":  PRO_DURATION_DAYS,
    }


# ── POST /api/subscription/webhook ───────────────────────────────
@router.post("/webhook")
async def flutterwave_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Flutterwave webhook events.
    Verifies webhook signature for security.
    """
    # Verify webhook signature
    signature = request.headers.get("verif-hash")
    if not signature or signature != settings.FLUTTERWAVE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature",
        )

    body = await request.json()
    event = body.get("event")

    # Handle successful charge
    if event == "charge.completed":
        data = body.get("data", {})
        if data.get("status") == "successful":
            # Log successful payment
            print(f"✅ Payment received: {data.get('tx_ref')} — ₦{data.get('amount')}")

    return {"status": "ok"}