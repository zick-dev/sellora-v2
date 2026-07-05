"""
backend/app/models/crypto_wallet.py
──────────────────────────────────────
Merchant-supplied crypto wallet addresses. Kormerce never generates,
holds, or touches these funds -- buyers send crypto directly to the
merchant's own wallet, mirroring the Bank Transfer flow. Verification
happens manually via receipt/tx-hash upload, same pattern as bank
transfer orders.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class CryptoWallet(Base):
    __tablename__ = "crypto_wallets"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    store_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    coin: Mapped[str] = mapped_column(String(20), nullable=False)          # e.g. "USDT", "BTC", "ETH"
    network: Mapped[str] = mapped_column(String(30), nullable=False)       # e.g. "TRC20", "ERC20", "BEP20", "Bitcoin"
    wallet_address: Mapped[str] = mapped_column(String(200), nullable=False)
    label: Mapped[str | None] = mapped_column(String(50), nullable=True)   # optional merchant note
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
