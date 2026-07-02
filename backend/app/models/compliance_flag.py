"""
backend/app/models/compliance_flag.py
────────────────────────────────────────
Records every automated compliance detection event. Kept even after
resolution so there's an audit trail of what was flagged and when.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class ComplianceFlag(Base):
    __tablename__ = "compliance_flags"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    store_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    flag_type: Mapped[str] = mapped_column(String(50), nullable=False)
    matched_term: Mapped[str | None] = mapped_column(String(200), nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
