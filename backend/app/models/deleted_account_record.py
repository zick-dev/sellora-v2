"""
app/models/deleted_account_record.py
───────────────────────────────────────
Minimal audit record kept after a merchant permanently deletes their
account. Exists ONLY for legal/financial compliance (tax records,
payment disputes) — does NOT retain any store, product, order, or
personal data beyond what's required.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DeletedAccountRecord(Base):
    __tablename__ = "deleted_account_records"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    flutterwave_customer_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    flutterwave_tx_ref: Mapped[str | None] = mapped_column(String(100), nullable=True)
    plan: Mapped[str | None] = mapped_column(String(20), nullable=True)

    deleted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<DeletedAccountRecord email={self.email} deleted_at={self.deleted_at}>"
