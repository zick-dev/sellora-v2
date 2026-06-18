"""
app/services/order_reminder.py
────────────────────────────────
Background task that checks for pending orders older than 24hrs
and sends reminder emails to merchants to update order status.

Called as a background task after every order creation so it
runs without blocking the API response.
"""

from datetime import datetime, timezone, timedelta
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.models.store import Store
from app.models.user import User
from app.services.email_service import send_order_status_reminder


async def check_and_send_order_reminders(db: AsyncSession) -> None:
    """
    Find all pending orders older than 24hrs and email the merchant.
    Groups orders by store so merchant gets one email per store.
    Runs as a background task — errors are caught and logged.
    """
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

        # Get all pending/confirmed/processing orders older than 24hrs
        result = await db.execute(
            select(Order, Store, User)
            .join(Store, Order.store_id == Store.id)
            .join(User, Store.user_id == User.id)
            .where(
                and_(
                    Order.status.in_(['pending', 'confirmed', 'processing']),
                    Order.created_at <= cutoff,
                )
            )
        )
        rows = result.all()

        if not rows:
            return

        # Group by merchant (user_id)
        merchant_orders: dict = {}
        for order, store, user in rows:
            key = user.id
            if key not in merchant_orders:
                merchant_orders[key] = {
                    'email': user.email,
                    'name': user.name,
                    'store_name': store.store_name,
                    'orders': [],
                }
            merchant_orders[key]['orders'].append({
                'id': order.id,
                'order_number': order.order_number,
                'customer_name': order.customer_name,
                'total_price': float(order.total_price),
                'status': order.status,
            })

        # Send one email per merchant
        for merchant_id, data in merchant_orders.items():
            await send_order_status_reminder(
                merchant_email=data['email'],
                merchant_name=data['name'],
                pending_orders=data['orders'],
                store_name=data['store_name'],
            )
            print(f"✅ Reminder sent to {data['email']} for {len(data['orders'])} orders")

    except Exception as e:
        print(f"❌ Order reminder check failed: {e}")
