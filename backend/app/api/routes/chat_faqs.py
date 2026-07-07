"""
backend/app/api/routes/chat_faqs.py
──────────────────────────────────────
Merchant-curated Q&A pairs for the storefront AI chat. Seller routes
manage the list; a public endpoint feeds the AI chat prompt builder.

Seller routes (JWT required):
    GET    /api/chat-faqs/store/{store_id}
    POST   /api/chat-faqs/store/{store_id}
    PUT    /api/chat-faqs/{faq_id}
    DELETE /api/chat-faqs/{faq_id}

Public route (no auth):
    GET    /api/chat-faqs/public/{store_id}
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.chat_faq import ChatFaq
from app.models.store import Store
from app.models.user import User
from app.schemas.chat_faq import ChatFaqCreate, ChatFaqUpdate, ChatFaqOut

router = APIRouter(prefix="/chat-faqs", tags=["Chat FAQs"])


async def get_owned_store(store_id: str, user_id: str, db: AsyncSession) -> Store:
    result = await db.execute(select(Store).where(Store.id == store_id, Store.user_id == user_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=403, detail="Access denied")
    return store


@router.get(
    "/public/{store_id}",
    response_model=list[ChatFaqOut],
    summary="List a store's FAQs for the AI chat prompt (public)",
)
async def list_public_faqs(store_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatFaq).where(ChatFaq.store_id == store_id).order_by(ChatFaq.created_at.asc())
    )
    return [ChatFaqOut.model_validate(f) for f in result.scalars().all()]


@router.get(
    "/store/{store_id}",
    response_model=list[ChatFaqOut],
    summary="List a merchant's chat FAQs",
)
async def list_faqs(
    store_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_owned_store(store_id, current_user.id, db)
    result = await db.execute(
        select(ChatFaq).where(ChatFaq.store_id == store_id).order_by(ChatFaq.created_at.asc())
    )
    return [ChatFaqOut.model_validate(f) for f in result.scalars().all()]


@router.post(
    "/store/{store_id}",
    response_model=ChatFaqOut,
    status_code=201,
    summary="Add a chat FAQ",
)
async def create_faq(
    store_id: str,
    payload: ChatFaqCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_owned_store(store_id, current_user.id, db)
    faq = ChatFaq(store_id=store_id, question=payload.question.strip(), answer=payload.answer.strip())
    db.add(faq)
    await db.flush()
    await db.refresh(faq)
    return ChatFaqOut.model_validate(faq)


@router.put(
    "/{faq_id}",
    response_model=ChatFaqOut,
    summary="Update a chat FAQ",
)
async def update_faq(
    faq_id: str,
    payload: ChatFaqUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ChatFaq).where(ChatFaq.id == faq_id))
    faq = result.scalar_one_or_none()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    await get_owned_store(faq.store_id, current_user.id, db)

    if payload.question is not None:
        faq.question = payload.question.strip()
    if payload.answer is not None:
        faq.answer = payload.answer.strip()

    await db.flush()
    await db.refresh(faq)
    return ChatFaqOut.model_validate(faq)


@router.delete(
    "/{faq_id}",
    status_code=204,
    summary="Delete a chat FAQ",
)
async def delete_faq(
    faq_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ChatFaq).where(ChatFaq.id == faq_id))
    faq = result.scalar_one_or_none()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    await get_owned_store(faq.store_id, current_user.id, db)

    await db.delete(faq)
    await db.flush()
    return None
