"""
backend/app/api/routes/ai.py
──────────────────────────────
AI Tools powered by Claude — Pro plan required.

Endpoints:
    POST /api/ai/generate — generate AI content (reply, FAQ, promo)
"""

from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["AI Tools"])


def user_is_pro(user: User) -> bool:
    """Check if user has an active Pro subscription."""
    return (
        user.plan == "pro" and
        user.plan_expires_at is not None and
        user.plan_expires_at > datetime.now(timezone.utc)
    )


@router.post(
    "/generate",
    summary="Generate AI content (Pro only)",
)
async def generate_ai_content(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """
    Generate AI content using Claude.
    Pro plan required. API key stays on the server — never exposed.
    """
    # ── Pro plan enforcement ──────────────────────────────────────
    if not user_is_pro(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Tools are a Pro feature. Upgrade to unlock Claude-powered tools.",
        )

    # ── Check API key is configured ───────────────────────────────
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Tools are coming soon! We're putting the finishing touches on this feature.",
        )

    # Temporarily disabled while Gemini billing/quota is being set up.
    # Remove this block once GEMINI_API_KEY has active quota.
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="AI Tools are coming soon! We're putting the finishing touches on this feature.",
    )

    prompt = payload.get("prompt", "")
    if not prompt or len(prompt) > 4000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt is required and must be under 4000 characters.",
        )

    # ── Call Gemini API from the backend ──────────────────────────
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}",
            headers={"content-type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"maxOutputTokens": 1024, "temperature": 0.7},
            },
        )

    if res.status_code != 200:
        print(f"❌ Gemini API error {res.status_code}: {res.text}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI generation failed. Please try again.",
        )

    data = res.json()
    text = ""
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        text = "No response generated."
    return {"text": text}


@router.post(
    "/product-description",
    summary="Generate product description (free for all users)",
)
async def generate_product_description(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """
    Generate a short, compelling product description from the product name
    and optional category. FREE for all users — no Pro plan required.
    This is the entry-point to AI value for free-tier merchants.
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI description generator is coming soon!",
        )

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

    try:
        import httpx
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"
        body = {"contents": [{"parts": [{"text": prompt}]}]}

        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.post(url, json=body)

        if res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service temporarily unavailable. Try again later.",
            )

        data = res.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        # Clean up any quotes the model might wrap it in
        if text.startswith('"') and text.endswith('"'):
            text = text[1:-1]

        return {"description": text}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable. Try again later.",
        )


@router.post(
    "/catalog-from-image",
    summary="Generate product details from a photo (free for all users)",
)
async def catalog_from_image(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """
    Analyze a product photo and generate title, description, and category.
    FREE for all users. Uses Gemini vision model.
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI catalog generation is coming soon!",
        )

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
        import httpx
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"
        body = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": "image/jpeg", "data": ""}} if image_url.startswith("data:") else
                    {"file_data": {"mime_type": "image/jpeg", "file_uri": image_url}} if image_url.startswith("gs://") else
                    {"text": f"Image URL: {image_url}"}
                ]
            }]
        }

        # For HTTP URLs, download the image first and send as base64
        if image_url.startswith("http"):
            async with httpx.AsyncClient(timeout=10) as client:
                img_res = await client.get(image_url)
            if img_res.status_code == 200:
                import base64
                b64 = base64.b64encode(img_res.content).decode("utf-8")
                content_type = img_res.headers.get("content-type", "image/jpeg")
                body = {
                    "contents": [{
                        "parts": [
                            {"text": prompt},
                            {"inline_data": {"mime_type": content_type, "data": b64}}
                        ]
                    }]
                }

        async with httpx.AsyncClient(timeout=20) as client:
            res = await client.post(url, json=body)

        if res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service temporarily unavailable.",
            )

        data = res.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

        # Clean up response
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.replace("```json", "").replace("```", "").strip()

        import json
        result = json.loads(text)
        return {
            "name": result.get("name", ""),
            "description": result.get("description", ""),
            "category": result.get("category", "Other"),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable.",
        )


@router.post(
    "/storefront-chat",
    summary="AI chat for storefront buyers (public, no auth)",
)
async def storefront_chat(
    payload: dict,
):
    """
    Public chatbot for buyers browsing a storefront. Answers product
    questions, pricing, delivery, and availability based on the store's
    actual catalog data. No authentication required.
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chat is temporarily unavailable.",
        )

    message = payload.get("message", "").strip()
    store_name = payload.get("store_name", "this store")
    products = payload.get("products", [])
    delivery_fee = payload.get("delivery_fee", 0)
    free_delivery_above = payload.get("free_delivery_above", 0)
    currency = payload.get("currency", "")
    whatsapp = payload.get("whatsapp", "")

    if not message:
        raise HTTPException(status_code=400, detail="Message is required.")

    # Build product catalog context
    catalog = ""
    for p in products[:20]:
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

CUSTOMER MESSAGE: "{message}"

RULES:
- Answer based ONLY on the catalog and policies above
- Be concise (2-3 sentences max)
- If asked about a product not in the catalog, say you don't have it and suggest similar items from the catalog
- If asked about sizes/colors not specified, suggest the customer contacts the store on WhatsApp
- Use a warm, helpful tone like a real shop assistant
- Include prices when mentioning products
- Never make up products, prices, or policies not listed above
- Reply in the same language the customer used"""

    try:
        import httpx
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"
        body = {"contents": [{"parts": [{"text": prompt}]}]}

        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.post(url, json=body)

        if res.status_code != 200:
            raise HTTPException(status_code=503, detail="Chat temporarily unavailable.")

        data = res.json()
        reply = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        return {"reply": reply}

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Chat temporarily unavailable.")
