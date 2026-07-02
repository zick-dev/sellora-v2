# Roadmap

## Shipped

- [x] Full brand rebrand: Sellora → Kormerce (naming, indigo/emerald theme, K logo mark)
- [x] Landing page: single-viewport, auto-cycling carousel, duotone photo background,
      mobile iPhone demo slide (auto-cycling Home/Product/Cart/Checkout screens)
- [x] Real-time currency conversion (FX service, buyer-location auto-detect, manual toggle,
      delivery fee conversion, all hardcoded currency instances fixed across dashboard)
- [x] Region-based Pro pricing (Africa: local currency, elsewhere: USD), detected via
      IP geolocation, applied consistently on landing page, /upgrade, and Settings
- [x] Navigation simplified from 9 dashboard pages to 5 (Home, Products, Orders, My Store, Account)
- [x] Setup checklist for new merchants (Home page, auto-hides when complete)
- [x] Bank Transfer + Receipt Upload (checkout payment option, merchant verification flow,
      IBAN/US routing number support decoupled from store's pricing currency, PDF or image
      receipts, auto-WhatsApp notification to merchant on bank transfer orders)
- [x] Abandoned Order Recovery (24hr detection, alert banner, WhatsApp follow-up)
- [x] Customer records / light CRM (auto-built from order history, no separate table)
- [x] Two-tier AI provider system — Gemini for Pro users/stores, OpenRouter (free models,
      auto-router + fallback chain) for free tier and as automatic fallback on Gemini failure.
      Covers product description generator, catalog-from-image, and storefront chatbot.
- [x] Storefront AI chatbot for buyers (public, answers from real catalog data, determines
      Gemini vs OpenRouter via store owner's Pro status)
- [x] Multi-image product gallery (up to 5 photos per product, swipeable carousel with
      touch gestures, arrows, dots, and image counter on both dashboard and storefront)
- [x] Storefront category navigation (single sticky nav bar, replaced scattered pills)
- [x] Link Engine: standalone product pages (server-rendered with OG/Twitter meta tags for
      rich social previews), click tracking table, Share modal on dashboard (Copy Link +
      WhatsApp free for all, Facebook Share + QR code gated to Pro)
- [x] Storefront → product page architecture: clicking a product navigates to its own page
      with full buying (variant picker, quantity, add to cart) instead of a modal; cart
      shared via localStorage between storefront and product pages
- [x] Meta Commerce Catalog feed — public CSV endpoint per store following Meta's official
      feed spec, merchants copy the URL into Meta Commerce Manager to manually sync products
      to Facebook Shop, Instagram Shopping, and WhatsApp catalogs. No Kormerce-side Meta app
      approval required for this method.
- [x] Merchant profile photo upload (Settings), avatar clickable from header/topbar
- [x] Reliability: storefront distinguishes real 404s from transient connection errors,
      shows "Hang tight, reconnecting..." with auto-retry instead of a false "Store not found"

## In Progress / Blocked

- [ ] **Gemini AI billing** — free tier quota still stuck at `limit: 0` on the existing API
      key. Not currently blocking anything since the OpenRouter fallback path is fully live,
      but Pro users won't get the Gemini quality bump until this is resolved.

## Next Up

1. **Meta Marketplace "Buy Now" native integration** — the deeper version of the catalog
   feed shipped above. Requires: Meta Business Manager + Commerce Manager verification for
   Kormerce itself, App Review for `catalog_management`/`commerce_account` permissions
   (weeks-long process, not guaranteed), per-merchant OAuth to connect their own Facebook
   Page/Business, and a real-time (not manual-feed) Catalog API push instead of the CSV feed.
   The current CSV feed is the correct interim step — it works today with zero approval
   friction, and the same underlying product data structure carries over once/if the full
   API integration is pursued. Region and business-category eligibility varies, so this
   should be evaluated against actual merchant volume before investing further.
2. **PWA upgrade** — installable app experience for both merchant dashboard and buyer
   storefront (manifest.json, service worker, icons, offline shell).
3. **Docs folder maintenance** — keep `Architecture.md`, `LinkEngine.md`, this file, and
   future `GrowthEngine.md` / `AIEngine.md` / `MerchantJourney.md` accurate as features ship.

## Deferred (deliberately, not forgotten)

These are real ideas from product strategy sessions but require foundational work first,
or are premature at current merchant/traffic scale:

- **Link Engine analytics dashboard** — needs `link_clicks` data to accumulate first (data
  collection started, no UI yet).
- **AI Growth Coach** (daily merchant insights/recommendations) — needs analytics data flowing
  before recommendations can be meaningful.
- **Merchant Growth Score** — natural evolution of the setup checklist; worth building once
  there are more signals to score against (orders, shares, repeat customers).
- **Social direct publishing** (auto-post to Instagram/TikTok/Facebook feed posts, not
  catalog/shopping) — platform APIs are restrictive; realistic version is "Generate & Copy,"
  not programmatic posting. Distinct from the Meta Commerce Catalog work above, which is
  specifically for Shop/Marketplace/catalog surfaces, not feed posts.
- **Merchant Discovery / marketplace search** — needs hundreds of active merchants before
  this makes sense; premature at current scale.
- **Payment gateway integration** (Paystack/Flutterwave) — deliberately deprioritized below
  Bank Transfer + Receipt Upload, which matches how target merchants already operate without
  requiring API keys, KYC, or transaction fees. Revisit once merchants are asking for it.
- **SEO meta tags on general storefront pages** — the standalone product page (Link Engine)
  already has this; extending proper OG/meta tags to the main store page and category views
  is a natural next quick win.
