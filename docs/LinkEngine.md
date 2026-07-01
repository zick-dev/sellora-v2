# Link Engine

## Purpose

Every product a merchant lists should be independently shareable, trackable, and discoverable —
not trapped inside a single storefront URL. The Link Engine is the system underneath share
buttons, QR codes, and (eventually) campaign analytics and AI growth recommendations. It was
built as one system on purpose, so future features (click analytics, campaign attribution,
referral tracking) slot in without redesigning the product page or database.

## What Exists Today

### Standalone Product Pages
Route: `frontend/app/store/[slug]/product/[productSlug]/page.tsx`

This is a **Next.js server component**, not a client component, specifically so
`generateMetadata()` can run server-side and produce real Open Graph / Twitter Card tags.
When a merchant pastes a product link into WhatsApp or Instagram, the platform fetches this
page server-side and renders a rich preview (product image, name, price) instead of a bare URL.

The actual interactive UI (image gallery, share buttons, QR modal) lives in a client component
(`ProductPageClient.tsx`) that the server component renders. This split is required — server
components can't hold `useState`/`useEffect`.

### Backend Endpoint
`GET /api/products/public/{store_id}/slug/{product_slug}` — public, no auth. Returns a single
product by its slug within a store. Product slugs are auto-generated from the product name at
creation time (`generate_slug()` in `products.py`) and are unique per store.

### Share Mechanisms (live now)
- **WhatsApp Share** — opens `wa.me` with a pre-filled message + link
- **Copy Link** — clipboard copy of the canonical product URL
- **QR Code** — generated on-the-fly via `api.qrserver.com` (no self-hosted QR generation yet)

### Click Tracking (foundation only — no UI yet)
Table: `link_clicks` (`backend/app/models/link_click.py`)
id            UUID (string)
product_id    UUID (string, nullable — null means a store-level click, not product-level)
store_id      UUID (string, required)
source        VARCHAR(30)   e.g. "whatsapp", "copy_link", "qr", "direct", "instagram"
clicked_at    TIMESTAMPTZ

Every visit to a standalone product page fires `POST /api/products/track-click` with a
`source` derived from the `?src=` query param appended to shared links (e.g. WhatsApp shares
append `?src=whatsapp`). This endpoint fails silently — tracking must never break the buyer's
experience, so any DB error is swallowed.

**No dashboard surfaces this data yet.** The table exists and is being populated from day one
specifically so that when Module 3 (Smart Link Tracking / analytics) gets built, there's
already months of real click data to report on instead of starting from zero.

## What Doesn't Exist Yet (intentionally deferred)

- **Direct publishing to Instagram/Facebook/TikTok** — platform APIs for this are restrictive
  and permission-gated for most merchant accounts. Not attempted. The realistic path is
  "Generate & Copy" (AI writes the caption, merchant pastes it manually) or native share-sheet
  intents, not programmatic posting.
- **Click analytics dashboard** — data is being captured (see above) but nothing renders it yet.
- **Campaign/referral attribution** — the `source` field on `link_clicks` is the seed for this,
  but there's no campaign entity or referral code system yet.
- **AI Growth Coach recommendations** — depends on analytics existing first (see
  `Architecture.md`'s roadmap ordering: tracking before coaching).

## Design Principle

Every Link Engine feature must survive being asked "does this still work if we later add
campaigns / QR analytics / referral codes?" The `source` field, the standalone product page,
and the click table were all built as generic building blocks rather than one-off features,
specifically so the answer stays yes.
