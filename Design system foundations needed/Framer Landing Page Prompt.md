# Framer prompt — LoyaltyLabs marketing landing page

Paste everything below into the Framer AI agent. It is written to be self-contained.

---

## 1. What I'm building

A public marketing landing page for **LoyaltyLabs**, a UK digital loyalty platform. Independent shops (bakeries, delis, coffee shops, florists, fish bars) run a points-and-stamps rewards programme; customers collect by having a QR code scanned at the till and redeem rewards from their phone. No plastic cards, no app-store friction for the shop, no paper stamp cards.

The page has exactly one job: **get the visitor to Get started (register) or Sign in.** Two audiences arrive on it:

- **Shop owners** (the paying customer, ~85% of intent) — want proof it takes minutes to set up, is cheap, and brings people back.
- **Customers** (the end user) — want to know it's just their phone, nothing to carry.

Primary CTA: **Get started — free 14-day trial** → `/sign-up`. Secondary: **Sign in** → `/sign-in`. A third, quieter link: **I'm a customer, not a shop** → `/sign-up?role=customer`.

Do not invent features beyond: QR scan to award points, digital stamp cards, points-based rewards, redemption confirmation codes, a customer wallet, an owner console with stats (points issued/redeemed, scans per day, customers, liability), reward campaigns you can pause, GBP/UK-only, Stripe-style plan tiers (Starter £29, Growth £59, Scale £70 per month).

---

## 2. Visual system — follow exactly, invent nothing

**Colour**
- Canvas `#F5F7F8`, raised surface `#FFFFFF`
- Secondary surface `#EBE3A7` (soft chartreuse-cream — use for quiet bands, quotes, stat strips)
- Primary action `#2B5748` (deep teal-green) · hover `#234739` · pressed `#1C3A2E` · tint `#E4EDEA`
- Accent `#FFF78D` (pale yellow) — **fills and indicators only, never text or strokes.** For accent-coloured text use `#5A5410`.
- Text `#1C1F16` / `#4E5346` / `#6E7679` · borders `#E1E6E8` / `#CBD3D6` · divider `#EDF0F2`
- Chart/graph accents (if you show a chart): teal `#2B5748` for issued, `#B79A00` for redeemed. No other hues anywhere on the page.

**Type** — Geist for everything, Geist Mono for codes, labels and figures.
- Hero headline: 64/1.02, weight 600, letter-spacing −0.03em (mobile 38/1.06)
- Section heading: 40/1.1, 600, −0.025em (mobile 28)
- Card title 18/1.25 600 · Body 17/1.6 400 · Small 14/1.5 400
- Eyebrow labels: Geist Mono 12px, 500, letter-spacing 0.12em, uppercase, `#6E7679`
- Every number, price and stat: `font-variant-numeric: tabular-nums`

**Shape & depth** — radius 8 buttons, 12 cards, 16 large media, pills only for status/tags. Rest shadow `0 1px 2px rgba(28,31,22,.04)`; hover `0 10px 22px -12px rgba(28,31,22,.22)`. No big drop shadows, no gradients on text, no glow.

**Glass** — allowed on chrome and overlays only: sticky nav `rgba(245,247,248,.72)` + `backdrop-filter: blur(18px) saturate(140%)` with a 1px `#E1E6E8` bottom edge; status pills over imagery `rgba(255,255,255,.62)` + `blur(10px)` + 1px `rgba(255,255,255,.75)`. Never glass over a price, a stat or body copy. Provide an opaque fallback.

**Hard no's:** purple/blue SaaS gradients, neon, glassmorphism everywhere, emoji, 3D blobs, marquees of fake logos, dark-mode hero, stock-photo people laughing at laptops, "AI-powered" language.

---

## 3. Motion direction — the point of this brief

The whole page should feel like **precise, quiet machinery**: things arrive, settle, and stop. Nothing loops forever in the periphery, nothing bounces, nothing parallaxes more than it needs to.

Global rules:
- Easing: `cubic-bezier(.22, 1, .36, 1)` for entrances, `cubic-bezier(.4, 0, .2, 1)` for state changes. No spring overshoot above 1.02.
- Durations: micro 120–180ms, entrance 320–420ms, orchestrated scenes up to 900ms total.
- Stagger children 60–80ms, max 6 items per group.
- Entrance distance: 12–20px translate, never more. Opacity 0→1 always paired with movement.
- Scroll-triggered animations fire **once**, at 25% viewport entry. No replay on scroll-up.
- Everything respects `prefers-reduced-motion: reduce` → all transforms removed, opacity-only fades at 150ms, looping animations frozen at their final frame.
- Nothing animates on top of text a user is reading. No layout shift from any animation.

---

## 4. Section-by-section spec (with the exact motion I want)

### 4.1 Sticky nav
Glass bar, 64px. Left: wordmark (22px teal rounded square + "LoyaltyLabs"). Right: `How it works`, `Pricing`, `For customers`, then **Sign in** (ghost) and **Get started** (filled teal, 40px, radius 8).
- Motion: transparent over the hero, and at scrollY > 80 it fades to the glass recipe + 1px edge over 180ms; the wordmark stays put.
- CTA hover: background to `#234739` in 160ms; press scale 0.985.

### 4.2 Hero — the one showpiece
Left column (55%): mono eyebrow `LOYALTY FOR UK INDEPENDENTS`, headline **"Regulars, not receipts."**, sub "Digital stamp cards and points for your shop. Your customers show a code, you scan, they come back." Two CTAs + a small trust line: `No card readers · No app for customers · Cancel anytime`.
Right column (45%): a **390px phone mock** of the customer wallet — teal balance card reading `1,240 pts`, a stamp row of 8 slots (5 filled in `#FFF78D`), a reward card, and a bottom nav.

Hero motion sequence (once, on load, total ≤ 900ms):
1. Eyebrow fades up 12px at 0ms.
2. Headline animates in **per line** (two lines), 14px up, 80ms stagger, 380ms each.
3. Sub + CTAs at 260ms, 12px up.
4. Phone enters from 24px below with a 0.98→1 scale, 420ms, starting at 180ms.
5. **Inside the phone, once it has settled (at ~700ms):** the points figure counts up 0 → 1,240 over 900ms with tabular figures so nothing reflows; then the 6th stamp slot fills — `#FFF78D` scaling 0.6→1 with a 300ms ease — and a small glass "+40 pts" pill rises 10px and fades out over 1.2s.
6. That in-phone micro-scene may loop, but **only** on a 6-second cycle, only while the hero is in view, and it must pause when out of view or when reduced-motion is set.

Background: flat `#F5F7F8`. Optional: one very low-contrast ring of `#EBE3A7` behind the phone at 40% opacity, static — no floating shapes.

### 4.3 Proof strip
Full-width `#EBE3A7` band, 4 stats in a row: `412 shops`, `38,204 customers`, `1.24M points issued`, `41% redemption rate`.
- Motion: each number counts up over 700ms when the band hits 25% viewport, 80ms stagger, tabular figures. Labels are static. No icons.

### 4.4 "How it works" — three steps, scroll-scrubbed
Three numbered steps, sticky visual on the right (desktop) / stacked on mobile:
1. **Set your rewards** — pick points per £1 and what they unlock. (Visual: reward-editor card with a stepper.)
2. **Scan at the till** — the customer shows their code; you scan on any phone. (Visual: dark scanner viewport with a `#FFF78D` sweep line, 2.6s ease-in-out loop.)
3. **They come back** — points land instantly, rewards nudge the next visit. (Visual: wallet card with a stamp filling.)
- Motion: as each step scrolls into the active band its number pill goes from `#EDF0F2`/grey to teal-tint/teal over 200ms, the copy raises 12px, and the sticky visual **cross-fades** (opacity + 8px slide, 320ms) to that step's card. Scrub position drives which step is active — no autoplay carousel.

### 4.5 Two-audience split
Two cards side by side: **For shops** (teal-tinted, primary CTA `Get started`) and **For customers** (white, ghost CTA `Join your local shop`).
- Motion: on hover, card lifts 2px, shadow to `0 10px 22px -12px rgba(28,31,22,.22)`, border to `#CBD3D6`, 180ms. On entrance, both cards fade up 16px with a 70ms stagger.

### 4.6 Owner console preview
A wide screenshot-style panel of the owner dashboard: 4 KPI cards, a 7-day bar chart, an issued-vs-redeemed line chart.
- Motion: the panel enters with a 20px rise; then bars **grow from the baseline** (transform-origin bottom, 420ms, 60ms stagger, seven bars) and the two line paths draw in via `stroke-dashoffset` over 900ms — teal first, the dashed `#B79A00` line 200ms behind it. Fires once. Bar heights must be exactly proportional to their values.

### 4.7 Pricing
Three cards: Starter £29, Growth £59 (marked `Most popular` with a `#FFF78D` pill), Scale £70. Per-month, `+ VAT`, GBP only. Each lists 4 lines max. Every card's CTA is `Start free trial` → `/sign-up`.
- Motion: entrance stagger 70ms; the middle card sits 8px higher at rest (no animation), hover lift as in 4.5. No price-toggle animation unless you add monthly/annual — if you do, cross-fade the figures with tabular alignment, 200ms, no sliding digits.

### 4.8 Quote
One shop-owner quote on `#EBE3A7`, 28/1.35, plus a `SHOP OWNER · BRISTOL` mono attribution. Fade up 12px only. No carousel.

### 4.9 Closing CTA + footer
Full-bleed teal `#2B5748` band: "Set it up this afternoon." + `Get started` (white button, teal text) + `Sign in` (ghost, white border). Footer on `#F5F7F8`: four link columns, a UK line, `© LoyaltyLabs 2026`.
- Motion: band enters with a 16px rise. Button hover raises white to full and adds the 2px focus ring on keyboard focus.

---

## 5. Interaction & accessibility requirements (non-negotiable)

- Both CTAs are real links (`/sign-up`, `/sign-in`) and are keyboard reachable in DOM order.
- Focus style everywhere: `2px solid #2B5748`, `outline-offset: 2px`. Never removed.
- Tap targets ≥ 44px, primary CTAs 48px on mobile.
- Body text ≥ 4.5:1 contrast; the pale accent `#FFF78D` never carries text or a stroke.
- Charts and counters have text labels, never colour alone.
- Full `prefers-reduced-motion` path as described in §3.
- No animation delays content: text must be visible within 400ms even if animations fail.

## 6. Responsive

- **390px is the source of truth.** Single column, 16px margins, hero phone drops below the copy at 88% width, "How it works" un-sticks into three stacked blocks, pricing stacks with the popular card first, nav collapses to wordmark + `Get started` with a sheet menu.
- **768px**: two-up cards, 24px margins, content caps at 640px.
- **1024px+**: the layouts above; content caps at 1200px and centres.
- Width buys density and columns, never bigger type. Type scale is identical from 1024 up.

## 7. Copy deck (use verbatim; British English)

- Hero H1: **Regulars, not receipts.**
- Hero sub: Digital stamp cards and points for your shop. Your customers show a code, you scan, they come back.
- Trust line: No card readers · No app for customers · Cancel anytime
- Steps: `Set your rewards` / `Scan at the till` / `They come back`
- Shops card: **Bring people back.** Set up in an afternoon, run it from the phone in your apron.
- Customers card: **Your local, in your pocket.** One code, every shop you visit. Nothing to carry.
- Quote: "We stopped reprinting stamp cards and started recognising our regulars." — SHOP OWNER · BRISTOL
- Closing: **Set it up this afternoon.** 14 days free, then £29 a month.

## 8. Deliverable

One responsive Framer page with the sections in the order above, real links to `/sign-up` and `/sign-in`, all motion implemented as specified, and a reduced-motion variant. Keep every colour, radius, shadow and font size to the values listed — this page has to sit next to an existing product UI built on exactly these tokens.
