"""
backend/app/models/link_click.py
──────────────────────────────────
Tracks clicks on shared product/store links. Foundation for the
Link Engine — powers future analytics, campaign attribution, and
AI growth recommendations. No UI surfaces this data yet, but every
click is captured from day one so nothing is lost when we build
the analytics layer.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class LinkClick(Base):
    __tablename__ = "link_clicks"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("products.id", ondelete="CASCADE"), nullable=True)
    store_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    source: Mapped[str | None] = mapped_column(String(30), nullable=True)  # whatsapp, copy_link, qr, instagram, etc.
    clicked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
