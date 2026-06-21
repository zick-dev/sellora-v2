"""
app/services/account_cleanup.py
──────────────────────────────────
Handles full cleanup when a merchant permanently deletes their account.

Responsibilities:
1. Delete all Cloudinary images belonging to the merchant (logo, banner,
   all product images) — Cloudinary holds no reference to "ownership"
   beyond the URL itself, so we collect every image URL first.
2. Archive minimal subscription/payment data into a lightweight audit
   table for legal/financial record-keeping (NOT personal/store data).
3. The actual DB row deletion (User → cascades to Store/Products/Orders/
   Leads) happens separately in the auth route, AFTER this cleanup runs.
"""

import re
import cloudinary
import cloudinary.uploader
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.store import Store
from app.models.product import Product
from app.models.deleted_account_record import DeletedAccountRecord

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)


def _extract_public_id(url: str) -> str | None:
    """
    Extract the Cloudinary public_id from a secure_url so we can delete it.
    Example URL:
      https://res.cloudinary.com/dkun9hvkf/image/upload/v1234567890/kormerce/abc123.jpg
    Public ID needed for deletion: kormerce/abc123
    """
    if not url or "cloudinary.com" not in url:
        return None
    match = re.search(r"/upload/(?:v\d+/)?(.+?)\.\w+$", url)
    return match.group(1) if match else None


async def cleanup_merchant_images(db: AsyncSession, store_id: str) -> int:
    """
    Delete all Cloudinary images tied to a merchant's store: logo, banner,
    and every product image. Returns count of images deleted.
    Failures are logged but never block account deletion — a merchant's
    right to delete their account takes priority over a stray image.
    """
    deleted_count = 0

    store_result = await db.execute(select(Store).where(Store.id == store_id))
    store = store_result.scalar_one_or_none()

    urls_to_delete = []
    if store:
        if store.logo_url:
            urls_to_delete.append(store.logo_url)
        if store.banner_url:
            urls_to_delete.append(store.banner_url)

    products_result = await db.execute(select(Product).where(Product.store_id == store_id))
    products = products_result.scalars().all()
    for product in products:
        if product.image_url:
            urls_to_delete.append(product.image_url)

    for url in urls_to_delete:
        public_id = _extract_public_id(url)
        if not public_id:
            continue
        try:
            cloudinary.uploader.destroy(public_id)
            deleted_count += 1
        except Exception as e:
            print(f"⚠️ Failed to delete Cloudinary image {public_id}: {e}")

    return deleted_count


async def archive_subscription_record(db: AsyncSession, user) -> None:
    """
    Archive minimal payment/subscription data before the user row is
    deleted, for legal and financial record-keeping only.
    Does NOT retain: name, store data, products, orders, or any
    personal/business information beyond what's needed for compliance.
    """
    record = DeletedAccountRecord(
        email=user.email,
        flutterwave_customer_id=user.flutterwave_customer_id,
        flutterwave_tx_ref=user.flutterwave_tx_ref,
        plan=user.plan,
        deleted_at=datetime.now(timezone.utc),
    )
    db.add(record)
    await db.flush()
