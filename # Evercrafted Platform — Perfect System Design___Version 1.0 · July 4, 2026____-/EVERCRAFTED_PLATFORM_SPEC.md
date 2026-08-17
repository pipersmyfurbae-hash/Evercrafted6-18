# Evercrafted Platform — System Design
Version 1.0 · July 4, 2026

## Vision
One platform, one pipeline, three surfaces. Moodoor (consumer) and Evercrafted Studio (creator) are not separate products — they are two faces of the same deterministic engine. Compression is the goal: one pipeline instead of three, one database instead of two, one AI backbone instead of two.

## The Three Surfaces

### Moodoor — moodoor.com (B2C emotional commerce)
Consumers give a memory, receive a wreath. Discovery by territory, not SKU. Purchase under 5 taps.
Flow: atmospheric signal → single input → EVS analysis (~3s) → territory reveal → 3 matched wreaths, weighted order → story-first product page → cart → Stripe.
Drop culture: seasonal releases, limited availability, waitlist psychology.

### Evercrafted Studio — studio.evercrafted.com (Creator SaaS / design OS)
For wreath makers, Etsy sellers, stylists. Subscription, 4 tiers.
Flow: client intake → EVS analysis → blueprint generation → render prompt → build guide → delivery.
- **Studio view** (from `studio.html`): client queue, EVS runner, blueprint generator, MJ prompt output, delivery tracker.
- **MakerStudio view**: full PIE implementation — polar coordinate canvas, R1–R18 rules, live 6-metric scoring radar, density feedback, collision detection (not clock-position text inputs).

### The Foundry — tab in Studio or foundry.evercrafted.com (Marketplace)
Makers publish blueprints; consumers buy to build themselves or commission a maker.
Stripe Connect royalties: 15% platform / 85% creator, automatic.
WGS genome string = portable design fingerprint (shareable, remixable, attributable).

## The Engine Pipeline

Four stages. All deterministic except Stage 1. Claude API touches only Stage 1 and Stage 3 (language). It never outputs coordinates.

**Cardinal rule: AI interprets emotion. Geometry places. These never cross.**

### Stage 1 — EVS Core (Claude API)
- Input: any emotional signal (memory text, mood keywords, occasion, image, seasonal intent)
- Output: EVSVector (7 dims) + Territory + Formula selection
- EVSVector dims (0.0–1.0 each): `warmth`, `energy`, `nostalgia`, `valence`, `intimacy`, `restraint`, `seasonal`
- Territories (6): I Comfort · II Celebration · III Remembrance · IV Renewal · V Connection · VI Seasonal Nostalgia
- Formulas (12): Crescent, Side Sweep, Bottom Heavy, Diagonal Flow, Twin Cluster, Corner Cluster, Wild Asymmetry, Half Ring, Top Cluster, Spiral Flow, Classic Balanced, Garden Scatter

### Stage 2 — Blueprint Engine / PIE (Deterministic)
- Input: EVSVector + Territory + Formula + seed integer
- Output: EC_WR_V2 Blueprint JSON
- Mulberry32 seeding — same seed + inputs = identical layout, always
- Placement Intelligence Engine (R1–R18) governs all spatial decisions: coverage classes, bloom nesting, balance scoring, density fields, negative-space enforcement, genome generation

EC_WR_V2 schema:
```json
{
  "blueprint_id": "EC_WR_V2_[seed]",
  "formula": "Crescent",
  "seed": 42,
  "emotional_tags": ["nostalgic", "restrained", "autumnal"],
  "canvas": { "type": "polar", "diameter_cm": 61, "base": "grapevine" },
  "clusters": [
    {
      "cluster_id": "C1",
      "type": "focal",
      "zone": "mid",
      "angle_deg": 315,
      "radius_norm": 0.62,
      "stems": [{ "item_id": "INV-001", "name": "Ivory Garden Rose", "qty": 3 }]
    }
  ],
  "silence_arcs": [{ "from_deg": 45, "to_deg": 135 }],
  "scores": {
    "balance": 0.88, "rhythm": 0.91, "proportion": 0.85,
    "contrast": 0.79, "silhouette": 0.93, "inventory_fit": 1.0
  },
  "genome": "WGS-CR-NOS-7542-A",
  "export": {
    "midjourney_prompt": "...",
    "shopify_handle": "ec-crescent-ivory-001"
  }
}
```

### Stage 3 — Output Pipeline (parallel, mixed AI + deterministic)
Input: EC_WR_V2 JSON. Output: 4 parallel artifacts.
1. **Render Prompt** (Claude API) — MJ/Flux prompt, WREATH_STYLE_DNA locked: 24" asymmetrical form, 3–5 odd-count clusters, matte petals + semi-gloss foliage, side-lit natural daylight 12–2pm, 85mm f/3.5. Geometry tokens → spatial language (R11).
2. **Build Guide PDF** (deterministic) — sequenced by R1–R18 (anchors → drama → fills). Material quantities with yield factors. Attachment notes. Assembly time estimate.
3. **WGS Genome String** (deterministic) — encodes formula, territory, seed, dominant species, emotional register, size class. Example: `WGS-CR-NOS-7542-A`.
4. **Listing Copy** (Claude API) — Etsy title/description/tags/pricing narrative from blueprint metadata. SEO + scarcity language for drops.

### Stage 4 — Commerce (deterministic)
Input: Product + payment intent. Output: fulfilled order.
Stripe (consumer) · Stripe Connect (creator payouts) · Supabase Storage signed URLs (24h expiry) for blueprint/PDF delivery · ShipStation/EasyPost for physical shipping labels.

## Data Model

Single Supabase PostgreSQL instance. Row-level security governs access. No Firebase, no Firestore, no parallel databases.

```sql
-- Core
users            (id, email, role: consumer|creator|operator, tier, auth_provider)
memory_sessions  (id, user_id, raw_input, evs_vector, territory_id, formula, created_at)
blueprints       (id, blueprint_json, genome_string, creator_id, score_avg, status, created_at)

-- Commerce
products         (id, type: finished|blueprint|bundle|kit, price, blueprint_id, territory_id, remaining, drop_id)
collections      (id, name, season, territory_ids[], blueprint_ids[])
drops            (id, name, release_at, collection_id, access_tier, waitlist_count)
orders           (id, user_id, product_id, type: finished|download, status, stripe_payment_id)
waitlist         (id, email, source, territory_id, created_at)

-- Creator
inventory_items  (id, creator_id, name, fisa_json, qty, emotional_tags[], size_cm)
genome_strings   (id, blueprint_id, encoded, version, mutations[])
creator_profiles (id, user_id, signature_territory, dna_string, marketplace_active)
```

## AI Architecture

**Claude API** (`claude-sonnet-4-6`, via Anthropic SDK, server-side only) handles:
- EVS vector extraction (Stage 1)
- Territory narrative generation
- Wreath critique + scoring explanation
- Listing copy (Etsy, Shopify)
- Lifestyle story generation
- Client intake synthesis (CDIE, Stage 1 normalization)
- Design copilot (maker assistant in Studio)
- Genome narrative descriptions

One locked system prompt per engine (emotion mapper, critique engine, narrative generator, listing writer). Prompts never cross functions.

**Flux via Replicate** (Flux 1.1 Pro, server-side only) handles:
- Photorealistic render generation from Style DNA prompts
- Product image editing (lifestyle scenes, door shots, room drops)
- Seasonal variant rendering from mutated genomes

**Deterministic (no AI)**:
- Blueprint geometry (PIE, R1–R18)
- Placement coordinate calculation
- Scoring mathematics (6-metric)
- Genome encoding/decoding (WGS)
- Inventory validation
- Seasonal drift calculation
- Coverage analysis

### Stack migration — 5 routes off Google Gemini
- `/api/match` → Claude API (EVS extraction)
- `/api/critique` → Claude API (wreath critique)
- `/api/copilot-chat` → Claude API (design assistant)
- `/api/copilot-story` → Claude API (narrative)
- `/api/copilot-optimize` → Claude API (design optimization)
- `/api/generate-image` → Flux via Replicate (render gen)
- `/api/edit-image` → Flux via Replicate (editing)
- `/api/locate-ateliers` → Google Maps API direct (not AI)

## Tech Stack

**Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS. Deployed on Vercel. SSR for product pages (SEO), API routes, image optimization, shared app-router layouts between Moodoor and Studio.

**Backend:**
- Next.js API routes — lightweight endpoints (auth, orders, waitlist, email)
- Python FastAPI — computation-heavy work (PIE engine, blueprint scoring, genome encoding)
- Deployed on Railway (FastAPI) + Vercel (Next.js)

**Database:** Supabase — Postgres + Auth + Realtime + Storage. Replaces Firebase. Auth handles email + OAuth. Storage delivers blueprint downloads and render assets. Realtime powers the operator order queue.

**AI:** Claude API (`claude-sonnet-4-6`) + Replicate (Flux 1.1 Pro). Both server-side only; API keys never reach the client.

**Payments:** Stripe (consumer) + Stripe Connect (creator payouts, 15%/85% split). Webhooks update order status in Supabase in real time.

**Email:** Resend + React Email. Templates: order confirmation, blueprint delivery, waitlist join, drop alert, creator payout notification, weekly creator digest.

**File delivery:** Supabase Storage signed URLs (24h expiry). PDF build guides via `react-pdf` on Railway. Blueprint JSON via direct Storage download.

## Experience Architecture

### Consumer journey (Moodoor)
1. **Discovery** — single atmospheric signal, one input. Target feeling: recognition ("this is for me").
2. **Matching** — EVS analysis (2–3s, Claude API), territory reveal, 3 matched wreaths with personalized explanation. Target feeling: felt-understood.
3. **Exploration** — territory pages as editorial worlds (own atmospheric register, palette, copy voice, collection), not filter panels.
4. **Possession** — product page: editorial story, emotional specs, genome visible, blueprint-vs-finished choice. One-tap cart, <60s Stripe checkout.
5. **Belonging** — immediate blueprint + build guide download; shipping confirmation + care instructions for finished wreaths; drop alerts by territory match; waitlist = joining a territory, not a list.

### Creator journey (Evercrafted Studio)
1. **Onboarding** — tier selection (Seed/Bloom/Studio/Atelier), inventory entry with auto-FISA profiling, first blueprint generated in-flow.
2. **Client Work** — CDIE normalizes messy input into structured brief; EVS → territory + formula; blueprint gen with live polar canvas; scoring radar shown immediately; render prompt compiled; client preview sent.
3. **Production** — PDF build guide, R1–R18 sequence (anchors → drama → fills), assembly time estimate, material list with sourcing notes, real-time order status.
4. **Growth** — publish to The Foundry, genome remix attribution, collection architecture tools, seasonal release planning, creator identity profile from design history.

### Drop architecture — 4 seasonal drops/year
- **−7 days:** territory signal (atmospheric image, no product), waitlist opens
- **−4 days:** territory narrative published
- **−1 day:** genome teaser (design DNA visible, no render)
- **Drop day:** full reveal, 2-hour early access for waitlist before public
- **Post-drop:** sold-out pieces → archive (collectible); genome stays available for maker builds

## Revenue Model

**Moodoor (B2C):**
- Finished wreaths: $295–450
- Digital blueprints: $32–45 (includes build guide PDF)
- Bundle sets: $120–200 (3–4 blueprints, collection-themed)
- Limited drop premium: +20–40% over catalog

**Evercrafted Studio (SaaS):**
| Tier | Price | Access |
|---|---|---|
| Seed | Free | 5 blueprints/mo, watermarked exports, no marketplace |
| Bloom | $49/mo | Unlimited blueprints, full export pipeline, Foundry access |
| Studio | $149/mo | Client management, API access, genome mutation, custom DNA |
| Atelier | $499/mo | Agency (multi-creator), priority, white-label, custom integrations |

**The Foundry (marketplace):** 85% creator / 15% platform via Stripe Connect. Future: genome licensing royalties on remix/mutation resale.

## Skill Map — Engines per Module

| Module | Primary | Supporting |
|---|---|---|
| EVS matching (HomeView) | emotional-design-translator | client-design-intake-engine |
| Blueprint generation | blueprint-composition-engine | placement-intelligence-engine |
| Blueprint scoring | blueprint-scoring-repair-engine | placement-intelligence-engine |
| MakerStudio PIE canvas | placement-intelligence-engine | blueprint-composition-engine |
| ArtisanCanvas prompts | faux-floral-render-engine | wreath-prompt-studio, style-dna-enforcement |
| Output pipeline | prompt-compiler | faux-floral-render-engine, builder-instructions-generator |
| Blueprint delivery (PDF) | builder-instructions-generator | manufacturing-builder |
| Genome system | wreath-genome-system | blueprint-reverse-engineer |
| Catalog enrichment | evs-fisa | floral-emotion-tagger, inventory-intelligence-engine |
| Territory architecture | emotional-design-translator | collection-intelligence-engine |
| Listing copy | marketplace-intelligence-engine | etsy-listing-builder |
| Drop system | experience-orchestration-engine | seasonal-blueprint-realizer |
| Collection architecture | collection-intelligence-engine | seasonal-blueprint-realizer |
| Blueprint marketplace | blueprint-marketplace-engine | marketplace-intelligence-engine |
| Creator identity | creator-identity-engine | style-dna-enforcement |
| Render generation | faux-floral-render-engine | midjourney-replicate-flux |
| Supplier + sourcing | supplier-sourcing-intelligence | evs-fisa |
| StudioView (operator) | evercrafted-app-builder | blueprint-composition-engine, placement-intelligence-engine |
| Web/marketing surfaces | evercrafted-web-builder | evercrafted-html-to-saas-builder |
| Kit products | evs-kit-commerce | marketplace-intelligence-engine |

## Build Sequence

**Phase 0 — Consolidate (Wk 1–2):** `moodoor__1_.zip` React/TS = master branch. Port `studio.html` → `StudioView.tsx` (11th tab, operator console). Port `cart.js` + `checkout.html` → `CartContext.tsx` + `CheckoutView.tsx`. Migrate 5 AI routes Gemini → Claude. Evaluate/port `support.js`.

**Phase 1 — Schema Bridge (Wk 3–4):** Build EVSVector → EC_WR_V2 translation layer (highest-leverage move). Upgrade `MakerStudioView` with polar SVG canvas + R1–R18. Add blueprint delivery pipeline (JSON + PDF via react-pdf). Inject WREATH_STYLE_DNA into `ArtisanCanvasView` prompt compilation.

**Phase 2 — Data Unification (Wk 5–6):** Migrate Firebase → Supabase, define canonical schema. RLS for consumer/creator/operator roles. Migrate Firestore data. Replace Firebase Auth with Supabase Auth.

**Phase 3 — Studio Productization (Wk 7–8):** Full SaaS tier structure (Supabase + Stripe). Inventory management with auto-FISA on entry. WGS genome encoding on all blueprints. Wire The Foundry with Stripe Connect.

**Phase 4 — Commerce Completion (Wk 9–10):** Drop system (scheduled releases, waitlist, early access, territory alerts). Seasonal Blueprint Realizer → DropsView. Email flows for purchase/delivery/drop/payout. Finished-wreath shipping (ShipStation/EasyPost).

**Phase 5 — Ecosystem Enrichment (Ongoing):** FISA profiling for all 12 existing catalog designs. Collection architecture for existing inventory. Creator identity profiles. Seasonal drop calendar (4x/yr). Genome marketplace SEO + attribution.

## Key Architectural Note

The EVSVector → EC_WR_V2 bridge is the single most important piece of architecture in the system. Once a memory maps to a vector and a vector produces a blueprint, Moodoor becomes the emotional discovery layer for Evercrafted-designed products, and Evercrafted becomes the invisible precision engine behind what consumers experience as intuitive wreath commerce.
