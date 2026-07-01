# API Reference (Key Endpoints)

Base URL (production): `https://sellora-v2-production.up.railway.app`
All routes are prefixed with `/api`. Auth uses JWT bearer tokens (`Authorization: Bearer {token}`)
with silent refresh — see `frontend/lib/api.ts`.

This is not exhaustive (FastAPI's auto-generated `/docs` covers everything). This file exists
to explain *why* certain endpoints are shaped the way they are, especially the public ones
buyers hit without auth.

## Auth
- `POST /auth/signup`, `POST /auth/login` — standard JWT issuance
- `POST /auth/refresh` — silent token refresh, called automatically by the frontend interceptor
  before a request would otherwise 401

## Store
- `POST /store/setup` — one-time, called from onboarding. A `User` can only have one `Store`.
- `GET /store/slug/{slug}` — **public**. Used by both the storefront and the standalone
  product pages to resolve a store by its URL slug.
- `PUT /store/me` — merchant-only update. All fields optional (`exclude_unset` pattern) —
  only send what changed. This is where bank transfer details, delivery fees, theme, and
  currency all get updated.

## Products
- `POST /products/store/{store_id}` — create. Auto-generates a unique slug from the name.
  Auto-sets `price_currency` from the store's current `base_currency` — this is intentional
  and should never be "fixed" by re-deriving it later; see `Architecture.md`'s currency section.
- `GET /products/public/{store_id}` — **public**. Only returns available, in-stock products.
- `GET /products/public/{store_id}/slug/{product_slug}` — **public**. Single product by slug,
  powers the Link Engine's standalone product pages.
- `PUT /products/{product_id}` — update. Variants and images use a "replace" strategy
  (delete all existing, insert the new set) rather than diffing — simpler and correct for
  the current UI (merchant always submits the full desired state).
- `POST /products/track-click` — **public**, fire-and-forget. Fails silently by design;
  see `LinkEngine.md`.

## Orders
- `POST /orders/` — **public** (buyer-facing, no auth). `payment_method` determines initial
  status: `bank_transfer` → `awaiting_verification`, everything else → `pending`.
- `GET /orders/{store_id}` — merchant-only, all orders for a store.
- `PUT /orders/{order_id}/status` — merchant-only status transitions.

## FX / Currency
- `GET /fx/rates/{base_currency}` — **public**. Returns all exchange rates from the given
  base currency, cached server-side 12 hours (`backend/app/services/fx_service.py`). The
  storefront calls this once per page load with the *buyer's detected currency* as the base,
  then converts every product price client-side via `convertPrice()` — this avoids one API
  call per product.

## AI (all currently gated on Gemini billing — see `Roadmap.md`)
- `POST /ai/product-description` — free for all users, not Pro-gated. Generates a 1-2 sentence
  description from a product name + category.
- `POST /ai/catalog-from-image` — free for all users. Downloads the product image, sends it
  to Gemini vision, returns `{name, description, category}`.
- `POST /ai/storefront-chat` — **public**, no auth. Buyer-facing chatbot. Receives the store's
  actual product catalog + delivery policy as context so it can't hallucinate products or
  prices that don't exist.
- `POST /ai/generate` — Pro-only, general-purpose AI tools (legacy endpoint, predates the
  free-tier endpoints above).

## Conventions Worth Knowing
- Public endpoints (no auth) are the ones buyers hit: store lookup, product lookup, order
  creation, FX rates, click tracking, storefront chat. Everything else requires a merchant JWT.
- Error handling on public endpoints favors **failing open** — e.g. click tracking swallows
  errors rather than breaking the buyer's page load. Merchant-facing endpoints fail loud
  (proper HTTP error codes) since merchants need to know when something's actually wrong.
