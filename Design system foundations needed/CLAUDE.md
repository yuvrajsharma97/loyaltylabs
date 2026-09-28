# LoyaltyLabs — project instructions

## Palette (current, supersedes the original ivory/olive brief)
- `#F5F7F8` canvas · `#FFFFFF` raised surface · `#EBE3A7` secondary surface
- `#2B5748` primary action (hover `#234739`, pressed `#1C3A2E`, tint `#E4EDEA`)
- `#FFF78D` accent — **fills and indicators only, never text or strokes** (pair with `#5A5410` for accent-on-cream text)
- Text `#1C1F16` / `#4E5346` / `#6E7679` · borders `#E1E6E8` / `#CBD3D6` · divider `#EDF0F2`
- Type: Geist + Geist Mono. Financial values always `font-variant-numeric: tabular-nums`.

## Glassmorphism (applies to every component from here on)
Glass is **chrome and overlay only**. Recipes:
- Chrome (app bar, bottom nav, left rail header): `background: rgba(245,247,248,.72); backdrop-filter: blur(18px) saturate(140%)` + 1px `#E1E6E8` edge. Content must scroll *behind* it, or it isn't glass.
- Overlay (bottom sheet, dialog): `background: rgba(255,255,255,.86); backdrop-filter: blur(28px) saturate(140%)` + 1px `rgba(255,255,255,.7)` inner edge.
- Scrim: `background: rgba(28,31,22,.34); backdrop-filter: blur(3px)`.
- Pill on imagery (status): `background: rgba(255,255,255,.62); backdrop-filter: blur(10px)` + 1px `rgba(255,255,255,.75)`.

Never glass: cards holding financial data, balance surfaces, list rows, inputs, or primary buttons — those stay opaque for contrast and scanning. Always keep text on glass at AA (≥4.5:1) against the *lightest* backdrop it can sit on. Provide an opaque fallback for `@supports not (backdrop-filter: blur(1px))`.

## Working rules
- Mobile-first, 390px is the primary target; width buys density, not size.
- Reuse the Store Card and dashboard patterns rather than inventing new anatomy.
- Design Foundations.dc.html is the source of truth for tokens; update it when a token changes.
