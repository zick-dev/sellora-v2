# Growth Engine & Vertical Templates — Update / Maintenance Plan

This document tracks two related workstreams agreed on July 2026: growth-oriented
features to widen Kormerce's audience, and vertical-specific storefront templates.
Each phase below ships independently with its own commit + push, so the live app
is never left in a broken intermediate state.

## Guiding principle for templates

One storefront engine, swappable presentation. All business logic (cart, checkout,
orders, AI chat, currency conversion, compliance) stays in the single StorefrontPage
component. Vertical differences are expressed as a template config keyed by the
store's existing `category_type` field -- no duplicated logic per vertical, no parallel
storefront codepaths to maintain.

---

## Sequence

### Phase 1 -- Growth Suggestions (small, independent wins)

Each of these ships and is pushed on its own; none depend on each other.

- [x] 1a. **Bulk/CSV product import** -- merchants migrating from Instagram/elsewhere
      often have 50-200 products already. Lowers switching-cost friction significantly.
      Shipped: POST /api/products/store/{id}/bulk-import (respects free-tier limit +
      compliance scan per row) + Import CSV modal with template download on Products page.
- [x] 1b. **WhatsApp buyer order-status notifications** -- auto-message the *buyer*
      (not just the merchant) when order status changes (confirmed, out for delivery,
      delivered). Builds buyer trust/retention; competitors mostly don't do this.
      Shipped: no Meta WhatsApp Business API approval available yet, so implemented as
      a one-tap pre-filled wa.me message that opens automatically after a merchant
      changes order status (confirmed/processing/delivered/cancelled), tailored per
      status. Real automatic (no-tap) sending is a future upgrade once WhatsApp Cloud
      API access is in place.
- [x] 1c. **Referral loop between merchants** -- free month of Pro for both referrer
      and referred, since merchant-to-merchant word of mouth is the natural acquisition
      channel for this audience.
      Shipped: unique referral_code per user (backfilled for existing users), signup
      accepts ?ref=CODE, valid code grants both parties 30 days of Pro, Invite & Earn
      card in Settings with shareable link + copy button.
- [x] 1d. **"Made with Kormerce" badge on free-tier stores** -- shown by default,
      removed automatically on Pro. Classic Wix/Carrd-style growth loop.
      Shipped: is_owner_pro computed field on public store lookup, badge rendered in
      storefront footer, hidden automatically when the store owner has active Pro.
- [ ] 1e. **Multi-language storefront detection** -- reuses the existing
      geolocation/currency-detection pattern to auto-adapt storefront language
      (French, Arabic, Turkish, etc.) for wider regional reach.
- [x] 1f. **"Demo Order" simulation for new merchants** -- reduces new-merchant anxiety
      by showing what an order looks like before real traffic arrives.
      Shipped: "See a Demo Order" button on empty Orders state creates a realistic
      sample order using the merchant's own real product (requires at least one product
      to exist). Tagged is_demo=True, shown with a DEMO badge, excluded from revenue
      totals, abandoned-order detection, and Customers view. Deletable via
      DELETE /api/orders/demo/{order_id}.

### Phase 2 -- Vertical Storefront Templates

**Phase 2.1 -- Visual templates only (no data model changes)**
- [ ] Define template config schema: hero style, product card layout, accent
      icon set, per `category_type` value already stored on Store.
- [ ] Build 3 initial presets: Fashion, Electronics, Food (the most structurally
      distinct verticals -- good test of whether the config approach holds up).
- [ ] Wire StorefrontPage to select template config based on `store.category_type`,
      falling back to the current general/default layout for anything unmatched.

**Phase 2.2 -- Smart filters per vertical**
- [ ] Surface vertical-appropriate filter UI (size/color for fashion, spec-range
      for electronics, meal category for food) using data that already exists --
      no new fields required yet.

**Phase 2.3 -- Vertical-specific product fields (only if actually needed)**
- [ ] Evaluate whether food's "modifiers/add-ons" (spice level, extra cheese) can
      be fully covered by the existing generic variant system (`variant_type_1/2`,
      `variant_value_1/2`) with relabeled UI, before adding any new table/fields.
      This is the outlier case most likely to need real schema work -- everything
      else should reuse what exists.

---

## Working rules for this update pass

- Each checked-off item gets its own git commit and push before starting the next,
  so a bad change can be isolated/reverted without losing unrelated work.
- No phase 2 work starts until phase 1 items in progress are either shipped or
  explicitly deferred back to this doc.
- Update this file's checkboxes as items ship -- this is the live tracking doc for
  the sequence, not just a planning artifact.
