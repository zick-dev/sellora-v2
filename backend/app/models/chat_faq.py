"""
backend/app/models/chat_faq.py
──────────────────────────────────
Merchant-curated Q&A pairs injected into the storefront AI chat prompt.
Deliberately scoped to non-product, store-specific knowledge (delivery
areas, bulk discounts, brand story, sizing notes, etc.) -- anything
price/stock-related should always come from the live catalog via
category-lock matching, never a cached answer, to avoid staleness.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Text, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class ChatFaq(Base):
    __tablename__ = "chat_faqs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    store_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    question: Mapped[str] = mapped_column(String(300), nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
