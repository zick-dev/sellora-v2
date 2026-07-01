# Roadmap

## Shipped

- [x] Full brand rebrand: Sellora → Kormerce (naming, indigo/emerald theme, K logo mark)
- [x] Landing page: single-viewport, auto-cycling carousel, duotone photo background
- [x] Real-time currency conversion (FX service, buyer-location auto-detect, manual toggle)
- [x] Navigation simplified from 9 dashboard pages to 5 (Home, Products, Orders, My Store, Account)
- [x] Setup checklist for new merchants (Home page, auto-hides when complete)
- [x] Bank Transfer + Receipt Upload (checkout payment option, merchant verification flow)
- [x] Abandoned Order Recovery (24hr detection, alert banner, WhatsApp follow-up)
- [x] Customer records / light CRM (auto-built from order history, no separate table)
- [x] AI product description generator (free, Gemini-powered — pending billing fix)
- [x] AI catalog generation from photo (free, Gemini vision — pending billing fix)
- [x] Storefront AI chatbot for buyers (public, answers from real catalog data)
- [x] Multi-image product gallery (up to 5 photos per product, carousel on storefront)
- [x] Storefront category navigation (single sticky nav bar, replaced scattered pills)
- [x] Link Engine foundation (standalone product pages, share buttons, click tracking table)

## In Progress / Blocked

- [ ] **Gemini AI billing** — free tier quota is stuck at `limit: 0` on the current API key.
      All AI features (product description, catalog generation, storefront chat) are built
      and wired but return "coming soon" until this is resolved. Considered alternatives:
      Groq (signup broken as of last attempt), Mistral, OpenRouter — not yet tried.

## Next Up

1. **PWA upgrade** — installable app experience for both merchant dashboard and buyer
   storefront (manifest.json, service worker, icons, offline shell).
2. **Docs folder maintenance** — keep `Architecture.md`, `LinkEngine.md`, this file, and
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
- **Social direct publishing** (auto-post to Instagram/TikTok/Facebook) — platform APIs are
  restrictive; realistic version is "Generate & Copy," not programmatic posting.
- **Merchant Discovery / marketplace search** — needs hundreds of active merchants before
  this makes sense; premature at current scale.
- **Payment gateway integration** (Paystack/Flutterwave) — deliberately deprioritized below
  Bank Transfer + Receipt Upload, which matches how target merchants already operate without
  requiring API keys, KYC, or transaction fees. Revisit once merchants are asking for it.
- **SEO meta tags on general storefront pages** — the standalone product page (Link Engine)
  already has this; extending proper OG/meta tags to the main store page and category views
  is a natural next quick win.
