"""
backend/app/api/routes/crypto_wallets.py
────────────────────────────────────────────
Merchant-managed crypto wallet addresses for manual crypto payments.
Kormerce never generates, holds, or touches crypto funds -- buyers send
directly to the merchant's own wallet, mirroring the Bank Transfer flow.

Seller routes (JWT required):
    GET    /api/crypto-wallets/store/{store_id}       — list a merchant's wallets
    POST   /api/crypto-wallets/store/{store_id}       — add a wallet
    PUT    /api/crypto-wallets/{wallet_id}             — update a wallet
    DELETE /api/crypto-wallets/{wallet_id}             — remove a wallet

Public routes (no auth):
    GET    /api/crypto-wallets/public/{store_id}       — active wallets for checkout
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.crypto_wallet import CryptoWallet
from app.models.store import Store
from app.models.user import User
from app.schemas.crypto_wallet import CryptoWalletCreate, CryptoWalletUpdate, CryptoWalletOut

router = APIRouter(prefix="/crypto-wallets", tags=["Crypto Wallets"])


async def get_owned_store(store_id: str, user_id: str, db: AsyncSession) -> Store:
    result = await db.execute(select(Store).where(Store.id == store_id, Store.user_id == user_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=403, detail="Access denied")
    return store


@router.get(
    "/public/{store_id}",
    response_model=list[CryptoWalletOut],
    summary="List active crypto wallets for checkout (public)",
)
async def list_public_wallets(
    store_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint -- only returns active wallets, used at storefront checkout."""
    result = await db.execute(
        select(CryptoWallet).where(
            CryptoWallet.store_id == store_id,
            CryptoWallet.is_active == True,  # noqa: E712
        ).order_by(CryptoWallet.created_at.asc())
    )
    return [CryptoWalletOut.model_validate(w) for w in result.scalars().all()]


@router.get(
    "/store/{store_id}",
    response_model=list[CryptoWalletOut],
    summary="List a merchant's crypto wallets",
)
async def list_wallets(
    store_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_owned_store(store_id, current_user.id, db)
    result = await db.execute(
        select(CryptoWallet).where(CryptoWallet.store_id == store_id).order_by(CryptoWallet.created_at.asc())
    )
    return [CryptoWalletOut.model_validate(w) for w in result.scalars().all()]


@router.post(
    "/store/{store_id}",
    response_model=CryptoWalletOut,
    status_code=201,
    summary="Add a crypto wallet",
)
async def create_wallet(
    store_id: str,
    payload: CryptoWalletCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_owned_store(store_id, current_user.id, db)
    wallet = CryptoWallet(
        store_id=store_id,
        coin=payload.coin.strip().upper(),
        network=payload.network.strip(),
        wallet_address=payload.wallet_address.strip(),
        label=payload.label,
    )
    db.add(wallet)
    await db.flush()
    await db.refresh(wallet)
    return CryptoWalletOut.model_validate(wallet)


@router.put(
    "/{wallet_id}",
    response_model=CryptoWalletOut,
    summary="Update a crypto wallet",
)
async def update_wallet(
    wallet_id: str,
    payload: CryptoWalletUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CryptoWallet).where(CryptoWallet.id == wallet_id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    await get_owned_store(wallet.store_id, current_user.id, db)

    if payload.coin is not None:
        wallet.coin = payload.coin.strip().upper()
    if payload.network is not None:
        wallet.network = payload.network.strip()
    if payload.wallet_address is not None:
        wallet.wallet_address = payload.wallet_address.strip()
    if payload.label is not None:
        wallet.label = payload.label
    if payload.is_active is not None:
        wallet.is_active = payload.is_active

    await db.flush()
    await db.refresh(wallet)
    return CryptoWalletOut.model_validate(wallet)


@router.delete(
    "/{wallet_id}",
    status_code=204,
    summary="Remove a crypto wallet",
)
async def delete_wallet(
    wallet_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CryptoWallet).where(CryptoWallet.id == wallet_id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    await get_owned_store(wallet.store_id, current_user.id, db)

    await db.delete(wallet)
    await db.flush()
    return None
