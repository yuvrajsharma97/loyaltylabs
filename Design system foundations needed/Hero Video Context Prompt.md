# Context prompt — hero video for the LoyaltyLabs landing page

Paste this whole document into ChatGPT. Its job is **not** to write marketing copy: it is to turn this context into ready-to-run video-generation prompts (Sora / Veo / Runway / Kling) for the hero section background of our landing page.

---

## PART A — THE ASK (read this first)

You are a senior motion director briefing a generative video model. Using the context in Part B–F, produce:

1. **Three distinct hero video concepts.** Each must differ on a named axis — not three variations of one idea. For each concept give: a one-line premise, why it fits the product, and the risk of it failing.
2. **For each concept, a production-ready prompt** in the structure given in Part G, tuned for a text-to-video model (state which model it suits best and why).
3. **A negative prompt** per concept, listing what must not appear.
4. **A fallback still-frame description** per concept, for the poster image and the `prefers-reduced-motion` path.
5. **One "safest" recommendation** with a sentence of justification.

Rules for your output:
- Every prompt must describe a **seamless 6–8 second loop** with the first and last frame visually identical.
- No text, no logos, no UI, no readable numbers anywhere in the footage — all typography is real HTML layered on top. Assume the video sits behind or beside the headline.
- No human faces as the subject. Hands are allowed (see Part D).
- The footage must survive being cropped from 21:9 down to 4:5 with the subject in the centre-safe area.
- Camera language must be restrained: slow push, slow orbit, or locked-off. No whip pans, no drone reveals, no speed ramps, no lens flares.
- Assume the video is muted and autoplays on loop.

Ask me at most **three** clarifying questions at the end, only if a genuine fork exists (e.g. real-shop realism vs abstract product-object). Do not ask about anything already specified below.

---

## PART B — PRODUCT CONTEXT

**LoyaltyLabs** is a UK digital loyalty platform for independent shops — bakeries, delis, coffee roasters, florists, fish bars. Not a bank, not a fintech app, not an enterprise SaaS.

How it works: the shop sets a rate (e.g. 4 points per £1) and rewards (a free flat white at 500 points, a free pastry at 300). The customer opens their wallet on their phone, staff scan the QR code at the till, points land instantly. Digital stamp cards run alongside points — 8 slots, fill them, claim a coffee. Redeeming produces a short confirmation code the customer shows at the counter. The shop owner gets a console: points issued vs redeemed, scans per day, customers, outstanding points liability, and reward campaigns they can pause.

**Who the hero speaks to:** the shop owner, first and foremost — someone who works a counter, prints stamp cards they're sick of reprinting, and knows their regulars by face. Second: the customer who doesn't want another plastic card or another app.

**The single feeling to land:** *quiet competence in a warm, human shop.* Not "disruption", not "growth hacking". The product replaces a chewed-up paper stamp card with something calm and instant.

**Emotional beats available to us:** the moment of recognition at a counter; the small satisfaction of a stamp filling; a code being scanned and something just working; a regular coming back.

## PART C — BRAND & VISUAL SYSTEM (bind the footage to this)

Palette — the footage should read as if graded to it:
- Warm off-white / cool paper ground `#F5F7F8`
- Soft chartreuse-cream `#EBE3A7` (think semolina, oat paper, unbleached card)
- Deep teal-green `#2B5748` — the brand's only strong colour; good as painted shopfront wood, an apron, tile, or deep shadow
- Pale yellow `#FFF78D` — used in-product as the accent fill; in footage it can only appear as a **small point of light or a single object**, never as a wash
- Ink `#1C1F16`

Grade: warm highlights, cool-neutral shadows, low contrast, **no orange-teal blockbuster grade**, no crushed blacks. Slight film grain is welcome; heavy bloom is not.

Type/shape language for reference (do not render): Geist sans, radius 8–16, 1px hairline borders, near-flat depth, one soft shadow. The footage should feel like the same designer chose it — flat, ordered, uncluttered.

Materials that fit: unbleached card, kraft paper, matte ceramic, brushed steel, oiled wood, linen apron, glass jar, brown paper bag, condensation, steam, flour dust in light.
Materials that don't: chrome, carbon fibre, glass skyscrapers, holograms, circuitry, neon, marble-and-gold luxury.

## PART D — SUBJECT & CONTENT CONSTRAINTS

Allowed and encouraged:
- A counter surface, shallow depth of field, morning window light.
- Hands only: a hand sliding a plate, tearing paper tape, holding a phone screen-down, a barista's hand on a tamper.
- Everyday shop objects: a stamp card in a jar, a loaf on a board, a cup on a saucer, a till, a paper bag being folded.
- Abstract-but-material alternatives: a grid of eight small ceramic dots filling one by one; a physical rubber stamp pressing kraft paper; a sheet of dot-matrix card rotating slowly.

Not allowed:
- Readable UI, phone screens showing an app, QR codes, numbers, prices, any text.
- Faces as the subject, staged smiling, "team collaborating" stock energy.
- Coins, credit cards, banking imagery, graphs, rising arrows, currency symbols.
- Crowds, cities, cars, drones, laptops in cafés, influencer aesthetics.
- Any moving thing that competes with headline legibility: nothing crossing the upper-left third at speed.

## PART E — LAYOUT & TECHNICAL FACTS

- The hero is a two-column layout at desktop: headline + two CTAs on the left (55%), product visual on the right (45%). The video is intended as **either** the right-hand visual **or** a full-bleed background at 8–14% opacity behind flat `#F5F7F8`. Write prompts that work for both, and say which you'd choose.
- Deliverables needed: **21:9** (desktop full-bleed), **16:9** (safe default), **4:5** (mobile), and note the centre-safe framing that makes one master crop into all three.
- 6–8s, seamless loop, 24 or 30fps, no audio, no baked text, and a version dark enough at the left third that white or ink text stays ≥ 4.5:1 — state which text colour each concept supports.
- Motion budget: subject movement should be slow enough to survive a 0.6–0.8s crossfade loop point.
- Also give me, per concept, a one-line note on how to make the loop invisible (matched first/last frame, or a "breathing" motion that returns to origin).

## PART F — TONE GUARDRAILS

Words that describe the right footage: calm, tactile, unhurried, ordinary, precise, warm, matter-of-fact, well-lit, honest.
Words that describe the wrong footage: dynamic, energetic, cutting-edge, futuristic, premium luxury, cinematic epic, hyper-real, glossy, aspirational.

If a concept starts to feel like a bank advert or a phone launch film, it is wrong. It should feel closer to a documentary shot of a good small shop at 8am.

## PART G — REQUIRED OUTPUT STRUCTURE (use this exactly, per concept)

```
CONCEPT n — <name>
Premise:            <one line>
Why it fits:        <one line tied to the product>
Failure risk:       <one line>
Best model:         <Sora | Veo | Runway | Kling> + why
Placement:          <right-hand visual | full-bleed background> + text colour it supports

PROMPT
Subject:            …
Action:             … (must return to its starting state)
Setting:            …
Lighting:           …
Lens & camera:      … (focal length, locked-off or slow move, speed)
Palette & grade:    … (name the hexes' real-world equivalents)
Texture & film:     …
Duration / loop:    6–8s seamless loop; <how the loop is hidden>
Aspect:             master aspect + centre-safe note
Negative prompt:    …

STILL FRAME (poster / reduced-motion): <one sentence>
```

End with: **RECOMMENDATION** — which concept to shoot first and why, in two sentences.
