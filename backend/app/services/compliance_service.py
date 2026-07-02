"""
backend/app/services/compliance_service.py
─────────────────────────────────────────────
Automated compliance detection for products and stores.

Flow: flag -> suspend (hide from public, not delete) -> email merchant
with grace period -> escalate only after grace period expires without
resolution, or on repeated/severe violations. Never auto-deletes on the
first detection. See docs/CompliancePolicy.md for the full policy text
and escalation rules.
"""

import re
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.store import Store
from app.models.product import Product
from app.models.compliance_flag import ComplianceFlag
from app.models.user import User
from app.services.email_service import send_compliance_email

GRACE_PERIOD_DAYS = 7

# Prohibited item categories — kept deliberately pattern-level, not an
# exhaustive keyword list, to avoid false positives on legitimate products
# that happen to share words with restricted items (e.g. "toy gun" vs "gun").
PROHIBITED_PATTERNS = [
    (r"\b(firearm|handgun|rifle|ammunition|ammo)\b", "weapons"),
    (r"\b(cocaine|heroin|methamphetamine|fentanyl)\b", "illegal_drugs"),
    (r"\b(counterfeit|replica\s+(rolex|gucci|louis\s+vuitton))\b", "counterfeit_goods"),
    (r"\b(stolen\s+goods|stolen\s+phone)\b", "stolen_goods"),
    (r"\b(human\s+organ|kidney\s+for\s+sale)\b", "prohibited_biological"),
    (r"\b(escort\s+service|prostitution)\b", "prohibited_services"),
]


def scan_text(text: str) -> tuple[str, str] | None:
    """Returns (flag_type, matched_term) if text matches a prohibited pattern, else None."""
    if not text:
        return None
    lowered = text.lower()
    for pattern, flag_type in PROHIBITED_PATTERNS:
        match = re.search(pattern, lowered)
        if match:
            return (flag_type, match.group(0))
    return None


async def scan_product(db: AsyncSession, product: Product) -> bool:
    """
    Scans a product's name and description for prohibited content.
    On match: creates a ComplianceFlag, suspends the store, and emails
    the merchant. Returns True if a flag was created.
    """
    combined_text = f"{product.name} {product.description or ''}"
    result = scan_text(combined_text)
    if not result:
        return False

    flag_type, matched_term = result

    flag = ComplianceFlag(
        store_id=product.store_id,
        product_id=product.id,
        flag_type=flag_type,
        matched_term=matched_term,
    )
    db.add(flag)

    store_result = await db.execute(select(Store).where(Store.id == product.store_id))
    store = store_result.scalar_one_or_none()
    if not store:
        return True

    # Only escalate compliance_status if not already flagged/suspended —
    # avoid resetting the grace period on every new flag for an already-flagged store
    if store.compliance_status == "active":
        now = datetime.now(timezone.utc)
        store.compliance_status = "suspended"
        store.compliance_flagged_at = now
        store.compliance_reason = f"Prohibited content detected: {flag_type} (matched: \"{matched_term}\")"
        store.compliance_grace_deadline = now + timedelta(days=GRACE_PERIOD_DAYS)

        user_result = await db.execute(select(User).where(User.id == store.user_id))
        user = user_result.scalar_one_or_none()
        if user:
            try:
                await send_compliance_email(
                    to_email=user.email,
                    merchant_name=user.name,
                    store_name=store.store_name,
                    reason=store.compliance_reason,
                    grace_deadline=store.compliance_grace_deadline,
                )
            except Exception as e:
                print(f"⚠️ Failed to send compliance email: {e}")

    await db.flush()
    return True
