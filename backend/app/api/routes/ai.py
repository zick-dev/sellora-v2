"""
backend/app/api/routes/ai.py
──────────────────────────────
AI Tools with a two-tier provider system:

  - Pro plan / Pro store owners → Gemini (higher quality)
  - Free tier / fallback on Gemini failure → OpenRouter (free models)

Endpoints:
    POST /api/ai/generate              — legacy Pro-only generic generation
    POST /api/ai/product-description   — free for all, tries Gemini if Pro
    POST /api/ai/catalog-from-image    — free for all, tries Gemini if Pro
    POST /api/ai/storefront-chat       — public, tries Gemini if store owner is Pro
"""

import base64
import json as jsonlib
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.store import Store

router = APIRouter(prefix="/ai", tags=["AI Tools"])

OPENROUTER_TEXT_MODELS = [
    "openrouter/free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
]
OPENROUTER_VISION_MODELS = [
    "openrouter/free",
    "google/gemma-4-26b-a4b:free",
]


def user_is_pro(user: User | None) -> bool:
    """Check if user has an active Pro subscription."""
    if user is None:
        return False
    return (
        user.plan == "pro" and
        user.plan_expires_at is not None and
        user.plan_expires_at > datetime.now(timezone.utc)
    )


async def call_gemini_text(prompt: str) -> str | None:
    """Try Gemini for a text-only prompt. Returns None on any failure."""
    if not settings.GEMINI_API_KEY:
        return None
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"
        body = {"contents": [{"parts": [{"text": prompt}]}]}
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.post(url, json=body)
        if res.status_code != 200:
            return None
        data = res.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        return None


async def call_openrouter_text(prompt: str) -> str | None:
    """Try OpenRouter for a text-only prompt, cycling through fallback models. Returns None if all fail."""
    if not settings.OPENROUTER_API_KEY:
        return None
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    for model in OPENROUTER_TEXT_MODELS:
        try:
            body = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
            }
            async with httpx.AsyncClient(timeout=20) as client:
                res = await client.post(url, headers=headers, json=body)
            if res.status_code != 200:
                print(f"⚠️ OpenRouter text error ({model}) {res.status_code}: {res.text[:200]}")
                continue
            data = res.json()
            return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"⚠️ OpenRouter text exception ({model}): {e}")
            continue
    return None


async def call_ai_text(prompt: str, prefer_gemini: bool) -> str:
    """
    Two-tier text generation: Gemini for Pro (with OpenRouter fallback on
    failure), OpenRouter directly for free tier. Raises HTTPException if
    both providers fail or are unconfigured.
    """
    text = None
    if prefer_gemini:
        text = await call_gemini_text(prompt)
    if text is None:
        text = await call_openrouter_text(prompt)
    if text is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable. Please try again shortly.",
        )
    return text


async def call_gemini_vision(prompt: str, image_bytes: bytes, content_type: str) -> str | None:
    """Try Gemini vision. Returns None on any failure."""
    if not settings.GEMINI_API_KEY:
        return None
    try:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"
        body = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": content_type, "data": b64}},
                ]
            }]
        }
        async with httpx.AsyncClient(timeout=20) as client:
            res = await client.post(url, json=body)
        if res.status_code != 200:
            return None
        data = res.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        return None


async def call_openrouter_vision(prompt: str, image_bytes: bytes, content_type: str) -> str | None:
    """Try OpenRouter vision models, cycling through fallback list. Returns None if all fail."""
    if not settings.OPENROUTER_API_KEY:
        return None
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    for model in OPENROUTER_VISION_MODELS:
        try:
            body = {
                "model": model,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{content_type};base64,{b64}"}},
                    ],
                }],
            }
            async with httpx.AsyncClient(timeout=25) as client:
                res = await client.post(url, headers=headers, json=body)
            if res.status_code != 200:
                print(f"⚠️ OpenRouter vision error ({model}) {res.status_code}: {res.text[:200]}")
                continue
            data = res.json()
            return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"⚠️ OpenRouter vision exception ({model}): {e}")
            continue
    return None


async def call_ai_vision(prompt: str, image_bytes: bytes, content_type: str, prefer_gemini: bool) -> str:
    """Two-tier vision generation, same fallback pattern as call_ai_text."""
    text = None
    if prefer_gemini:
        text = await call_gemini_vision(prompt, image_bytes, content_type)
    if text is None:
        text = await call_openrouter_vision(prompt, image_bytes, content_type)
    if text is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable. Please try again shortly.",
        )
    return text


def clean_json_response(text: str) -> str:
    """
    Extract a JSON object from a model's raw text response. Smaller/free
    models often wrap JSON in markdown fences or add preamble text despite
    instructions not to — this pulls out just the {...} block.
    """
    text = text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    return text


@router.post(
    "/generate",
    summary="Generate AI content (Pro only)",
)
async def generate_ai_content(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """Legacy general-purpose endpoint. Pro plan required."""
    if not user_is_pro(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Tools are a Pro feature. Upgrade to unlock more powerful tools.",
        )

    prompt = payload.get("prompt", "")
    if not prompt or len(prompt) > 4000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt is required and must be under 4000 characters.",
        )

    text = await call_ai_text(prompt, prefer_gemini=True)
    return {"text": text}


@router.post(
    "/product-description",
    summary="Generate product description (free for all, Gemini for Pro)",
)
async def generate_product_description(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """
    Generate a short, compelling product description from the product name
    and optional category. FREE for all users. Pro users get Gemini quality;
    free tier uses OpenRouter.
    """
    product_name = payload.get("name", "").strip()
    category = payload.get("category", "").strip()

    if not product_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product name is required to generate a description.",
        )

    prompt = f"""Write a short, compelling product description for an e-commerce store.
Product name: {product_name}
{"Category: " + category if category else ""}

Requirements:
- 1-2 sentences maximum
- Highlight key selling points
- Use a friendly, confident tone
- Do NOT include the product name in the description
- Do NOT use quotes around the description
- Write in English"""

    text = await call_ai_text(prompt, prefer_gemini=user_is_pro(current_user))
    if text.startswith('"') and text.endswith('"'):
        text = text[1:-1]
    return {"description": text}


@router.post(
    "/catalog-from-image",
    summary="Generate product details from a photo (free for all, Gemini for Pro)",
)
async def catalog_from_image(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """
    Analyze a product photo and generate title, description, and category.
    FREE for all users. Pro users get Gemini vision; free tier uses
    OpenRouter's free vision model.
    """
    image_url = payload.get("image_url", "").strip()
    if not image_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product image URL is required.",
        )

    prompt = """You are a product catalog assistant for an African e-commerce platform.
Analyze this product image and return ONLY a JSON object with these fields:
- "name": a short, catchy product title (max 60 chars)
- "description": a compelling 1-2 sentence description highlighting key features
- "category": the most fitting product category from this list: Clothing, Shoes, Bags, Accessories, Electronics, Beauty, Food, Home, Health, Other

Return ONLY the JSON object, no markdown, no backticks, no explanation."""

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            img_res = await client.get(image_url)
        if img_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Could not fetch product image.")
        image_bytes = img_res.content
        content_type = img_res.headers.get("content-type", "image/jpeg")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Could not fetch product image.")

    text = await call_ai_vision(prompt, image_bytes, content_type, prefer_gemini=user_is_pro(current_user))
    text = clean_json_response(text)

    try:
        result = jsonlib.loads(text)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI could not analyze this image. Try a different photo.",
        )

    return {
        "name": result.get("name", ""),
        "description": result.get("description", ""),
        "category": result.get("category", "Other"),
    }


@router.post(
    "/storefront-chat",
    summary="AI chat for storefront buyers (public, Gemini if store owner is Pro)",
)
async def storefront_chat(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """
    Public chatbot for buyers browsing a storefront. Answers product
    questions, pricing, delivery, and availability based on the store's
    actual catalog data. Uses Gemini if the store owner has an active Pro
    subscription, otherwise OpenRouter.
    """
    message = payload.get("message", "").strip()
    history = payload.get("history", [])
    store_name = payload.get("store_name", "this store")
    store_id = payload.get("store_id", "")
    products = payload.get("products", [])
    delivery_fee = payload.get("delivery_fee", 0)
    free_delivery_above = payload.get("free_delivery_above", 0)
    currency = payload.get("currency", "")
    whatsapp = payload.get("whatsapp", "")

    if not message:
        raise HTTPException(status_code=400, detail="Message is required.")

    # Determine if the store owner has Pro — public endpoint, so look up via store_id
    prefer_gemini = False
    if store_id:
        try:
            result = await db.execute(
                select(Store).where(Store.id == store_id)
            )
            store = result.scalar_one_or_none()
            if store:
                user_result = await db.execute(
                    select(User).where(User.id == store.user_id)
                )
                owner = user_result.scalar_one_or_none()
                prefer_gemini = user_is_pro(owner)
        except Exception:
            prefer_gemini = False

    catalog = ""
    for p in products[:25]:
        status_txt = "In stock" if p.get("in_stock") else "Out of stock"
        catalog += f"- {p['name']}: {currency}{p['price']:,.0f} ({p.get('category', 'General')}) [{status_txt}]\n"

    prompt = f"""You are a helpful, friendly shopping assistant for "{store_name}", an online store.

STORE CATALOG:
{catalog if catalog else "No products listed yet."}

STORE POLICIES:
- Delivery fee: {currency}{delivery_fee:,.0f} per order
- Free delivery on orders above: {currency}{free_delivery_above:,.0f}
- Payment: Pay on delivery or bank transfer
{f"- WhatsApp: {whatsapp}" if whatsapp else ""}

{"CONVERSATION SO FAR:" if history else ""}
{chr(10).join([("Customer: " + h.get("text","")) if h.get("role") == "user" else ("You: " + h.get("text","")) for h in history[:-1]]) if history else ""}

CUSTOMER MESSAGE: "{message}"

RULES:
- Before answering, carefully scan the ENTIRE catalog above line by line. Do not assume an item is unavailable without checking every line first.
- Use the conversation history above to understand follow-up questions (e.g. "what's the cheapest for that size" refers to whatever product/size was just discussed)
- Answer based ONLY on the catalog and policies above
- Be concise (2-3 sentences max)
- If, after checking every line, a product genuinely is not in the catalog, say so clearly and suggest similar items from the catalog
- If asked about sizes/colors not specified, suggest the customer contacts the store on WhatsApp
- Use a warm, helpful tone like a real shop assistant
- Include prices when mentioning products
- Never make up products, prices, or policies not listed above, and never claim an item is unavailable if it is actually listed in the catalog above
- Reply in the same language as the CUSTOMER MESSAGE above. If the customer wrote in English, you must reply in English. Do not switch languages unless the customer's message is in a different language."""

    reply = await call_ai_text(prompt, prefer_gemini=prefer_gemini)
    return {"reply": reply}


@router.post(
    "/generate-policy",
    summary="Generate a store policy document (free for all, Gemini for Pro)",
)
async def generate_policy(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """
    Auto-generate a Return Policy, Shipping Policy, or Terms of Service
    tailored to the merchant's store. FREE for all users. Pro users get
    Gemini quality; free tier uses OpenRouter.
    """
    policy_type = payload.get("policy_type", "").strip()
    store_name = payload.get("store_name", "the store").strip()
    delivery_fee_info = payload.get("delivery_info", "").strip()

    valid_types = {"return_policy": "Return &amp; Refund Policy", "shipping_policy": "Shipping &amp; Delivery Policy", "terms_of_service": "Terms of Service"}
    if policy_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="policy_type must be one of: return_policy, shipping_policy, terms_of_service",
        )

    label = valid_types[policy_type]

    prompts = {
        "return_policy": f"""Write a clear, fair Return & Refund Policy for an online store called "{store_name}".
This store sells on a pay-on-delivery / social commerce basis (WhatsApp/Instagram orders, delivered locally).
Include: return window (7 days is standard), condition items must be in, how to request a return, refund method and timeline, and any exceptions (e.g. final sale items).
Write in plain, friendly language a small business would use. Format as short paragraphs with clear headers. Keep it under 300 words.""",
        "shipping_policy": f"""Write a clear Shipping & Delivery Policy for an online store called "{store_name}".
This store delivers locally and may offer pay-on-delivery. Include: delivery timeframes, delivery fee explanation, what happens if delivery fails, and how customers can track their order (via WhatsApp).
Write in plain, friendly language a small business would use. Format as short paragraphs with clear headers. Keep it under 250 words.""",
        "terms_of_service": f"""Write simple, fair Terms of Service for an online store called "{store_name}" operating on a social commerce platform (orders via WhatsApp/Instagram, pay on delivery or bank transfer).
Include: acceptance of terms, order process, pricing and payment, delivery, returns (reference a separate return policy), limitation of liability, and contact method.
Write in plain, accessible language, not dense legal jargon. Format as short numbered sections. Keep it under 400 words.""",
    }

    prompt = prompts[policy_type]
    text = await call_ai_text(prompt, prefer_gemini=user_is_pro(current_user))
    return {"policy_type": policy_type, "label": label, "content": text}
