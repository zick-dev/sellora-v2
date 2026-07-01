# Kormerce — Architecture

## What Kormerce Is

Kormerce is a social commerce platform for African WhatsApp/Instagram sellers. It gives merchants
a real, branded storefront they can set up in minutes, without cards, bank integrations, or
technical knowledge. Kormerce doesn't replace WhatsApp — it extends it. Merchants keep chatting
with customers on WhatsApp; Kormerce handles the storefront, catalog, orders, and payment tracking.

## Repository Structure
sellora-v2/                    (repo name, product name is Kormerce)
├── backend/                   FastAPI + PostgreSQL + JWT, deployed on Railway
│   └── app/
│       ├── api/routes/        One file per resource (auth, store, products, orders, ai, fx...)
│       ├── models/            SQLAlchemy models (one file per table)
│       ├── schemas/           Pydantic request/response schemas
│       ├── services/          Business logic that doesn't belong in a route (email, FX, cleanup)
│       └── core/               config.py, database.py, security.py
├── frontend/                  Next.js 16 + Tailwind v4 + Zustand, deployed on Vercel
│   └── app/
│       ├── (auth)/            Login, signup, password reset
│       ├── (dashboard)/       Merchant-facing app (5 nav pages: Home, Products, Orders, My Store, Account)
│       ├── store/[slug]/      Public buyer-facing storefront
│       └── page.tsx           Public landing page
└── docs/                      This folder

## Core Conventions

- **IDs are strings, not native UUID types.** Every model uses `Mapped[str]` with
  `UUID(as_uuid=False)` at the SQLAlchemy layer. This keeps Pydantic validation simple —
  `id: str` in schemas always matches. New tables must follow this pattern or Pydantic
  validation will fail at runtime (this bug has happened twice — see `ProductImage`).
- **Pure inline styles, no Tailwind arbitrary classes** in the dashboard/storefront UI.
  Colors come from `lib/theme.tsx`'s `C` object (dark/light palettes).
- **Windows uses `python`, Linux uses `python3`.** Windows PG runs on port 5433, Linux on 5432.
- **File edits use the heredoc method** (`cat > file << 'EOF'`) for full rewrites, or exact
  string-match `str_replace` for surgical edits. Always re-view a file after editing before
  editing it again — stale context causes failed matches.
- **`encoding='utf-8'`** on all Python file I/O — Windows defaults to a different encoding
  and will corrupt em-dashes/emoji otherwise.

## Data Flow: Merchant → Storefront → Buyer

1. Merchant creates a `Store` (one per `User`, enforced 1:1 at signup/onboarding).
2. Merchant adds `Product`s to their store. Each product locks in `price_currency` from the
   store's `base_currency` at creation time — this never changes even if the merchant later
   switches currencies (see `docs/CurrencyEngine.md` — not yet written, covered inline in FX
   service comments for now).
3. Buyer visits `/store/{slug}` (public, no auth). Storefront fetches store + products via
   public endpoints (`/api/store/slug/{slug}`, `/api/products/public/{store_id}`).
4. Buyer places an `Order`. Payment method is either `pay_on_delivery` or `bank_transfer`
   (the latter requires a receipt upload and starts in `awaiting_verification` status).
5. Merchant manages orders from the dashboard: confirm, mark processing, mark delivered,
   or cancel. Customer records (light CRM) are auto-derived from order history — no separate
   customer table exists yet.

## Currency Handling

- Every `Store` has a `base_currency` merchants choose at setup or change later.
- Every `Product` has a `price_currency` locked at creation time (never mutated).
- The storefront converts prices at **display time** using live FX rates
  (`/api/fx/rates/{base}`, cached server-side for 12 hours). See `docs/LinkEngine.md` sibling
  doc pattern — FX logic lives in `backend/app/services/fx_service.py`.
- Buyers see prices in **their own detected currency** by default (IP geolocation via
  ipapi.co), with a toggle to switch to the store's base currency. Conversion is two-step:
  `from → base → to`, rounded to clean numbers (no `1,492.37` style prices).

## Known Technical Debt

- No formal migrations tool — schema changes are applied via raw `ALTER TABLE` / `CREATE TABLE`
  SQL run manually against Railway Postgres. This works but has no rollback story and no
  version history. Worth revisiting (Alembic) before the schema grows much further.
- Customer records are computed client-side from order history on every page load, not stored.
  Fine at current scale; will need a real `customers` table once order volume grows.
- `link_clicks` table exists and is being written to, but has no reporting UI yet — see
  `docs/LinkEngine.md`.
