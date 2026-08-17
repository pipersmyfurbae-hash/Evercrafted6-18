# Moodoor Studio

Two tools from the Moodoor pipeline, implemented from the Claude Design handoff in
`project/`:

- **Brief Generator** — a brief in, a complete collection package out, sourced into
  real `LibraryItem` recipes against the EFS-1.0 floral canon.
- **Prompt Library** — those recipes compiled into Midjourney v7 render prompts,
  scored, and archived.

React 18 + TypeScript + Vite. No backend.

```bash
npm install
npm run dev        # http://localhost:5173
```

Add your Anthropic API key under **Settings** before generating — see
[API key](#api-key) below.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Serve the built output |
| `npm run typecheck` | Types only |
| `npm run smoke` | Runs the engine against the real canon — recipes, EVS, prompts, validator |

---

## The pipeline

Both pages read and patch the same `LibraryItem` records in `localStorage` under
`moodoor_library_items`, so nothing moves between them by hand.

```
brief ──▶ Brief Generator ──▶ LibraryItem[] ──▶ Prompt Library ──▶ blueprint + prompts
              │                    │                                      │
       collection package    recipes sourced from                  written back onto
       (hierarchy, palette,  in-stock SKUs only                    the same item, for
        release, bundles)                                          Studio downstream
```

`src/lib/storage.ts` owns every key. `LibraryItem` is defined in
`src/types/library.ts`.

### Brief Generator

Three modes, each framing the same engine differently:

| Mode | Input | Output |
| --- | --- | --- |
| Bespoke client request | A raw client memory or request | Normalized brief + 8-product package, items 1–2 as the deliverable |
| Mood / theme collection | A season, theme, or feeling | The full 8-product hierarchy |
| Whole-home collection | A home and an occasion | 10–16 products selected from the 32-form library |

Every product becomes a `LibraryItem` sourced **only** from species with
`sku_count > 0`. If the generated brief names one of the five zero-stock canon
species (Cotton Stem, Amaranthus, Lavender, Lamb's Ear, Viburnum Berry), it is
reported in an amber **register gap** banner rather than silently substituted.

The **Render** tab previews item 1's hero frame — one of the six camera angles —
built by the *same engine the Compose step uses*, not a separately written
concept prompt, so what you see is what you get downstream. Whole-home mode has
no single hero product, so it shows the collection-level bouquet shot instead.

### Prompt Library

**Library** — filter the archive by formula, season and emotional tag. Each entry
opens to its machine-facing and paste-ready prompts, its parameter tail, and a
live accuracy score.

**Compose** — two paths in:

- **Whole-home forms** carry a `form_code`, so their prompts build instantly with
  no API call — all six camera angles, plus a Greenery Base for greenery-only
  forms.
- **Blueprint items** prefill an `EC_WR_V2` JSON. Step 1 drafts the expressive
  language layers via Claude; step 2 compiles them with structural data and
  locked Style DNA.

**Save** files the six angles under **Prompts** and writes them back onto the
shared `LibraryItem`, which drops it out of the "awaiting a render" list.

---

## Render prompt engine

`src/lib/prompts.ts` is the single source of truth for form-based prompts;
`src/lib/composer.ts` handles blueprint JSON. Both pages import them, so a
mantel garland can never be described as a wreath in one place and not the other.

`src/lib/geometry.ts` is the polar arc algebra — `subtractArcs`, `mergeRanges`,
`complementRanges`, sector naming — **ported from the Evercrafted Placement
Engine's `core/geometry.js`**, typed and trimmed to what Moodoor needs (nothing
here draws, so the SVG path builders stayed behind). The angle convention is kept
identical to the source so the two stay interchangeable: degrees only, clockwise
from 12 o'clock, with clock notation as a display format. `src/lib/placement.ts`
is the analysis layer built on it.

Rules the engine enforces:

- **Product nouns come from `form_code`.** A1 is a *mantel garland* draped along a
  stone mantel; D3 is a *staircase cascade* on a stair railing; P2 is a *stem
  bundle* shot flat-lay. Never "wreath" by default.
- **Scale, formula and the ribbon rule are read from the canon**
  (`src/data/formLanguage.ts`), so the prose can't drift from the product spec.
  23 forms get a hand-tied bow, 8 are told explicitly *not* to have one, and S6
  gets a ribbon tail.
- **Negatives are cleaned per form.** A `--no` token is dropped when the piece
  actually uses it as a material (no "no ivy" on an ivy cascade) or when it
  contradicts the form — candle rings are meant to be centred, a kraft-wrapped
  stem bundle *is* a bouquet.
- **Bloom vs greenery comes from the species canon**, not the per-SKU
  `primary_role` tag, which routinely mislabels dahlias and roses as foliage.
- **Odd stem counts only.** Even quantities are rounded up.
- **v7 syntax.** No `::` weighting and no `--q` — dominance is carried by word
  order, with the focal named first.
- **One subject, six cameras.** `src/data/cameras.ts` defines the shot set. A
  camera is five correlated cues — lens, framing distance, camera height, depth
  of field, aspect ratio — moved as one bundle; changing a single cue lands the
  render between two looks. Everything naming the *piece* is byte-identical
  across the set, including `--s`, so six renders read as one wreath photographed
  six ways rather than six different wreaths. Two exceptions are declared in the
  table and enforced by tests: the macro crop drops the silence-arc clause (the
  bare arc is outside the frame, and naming it invites grapevine into a crop that
  should be all petal), and the flat lay replaces the wall mount because it is
  lying on a surface.
- **Only two angles verify a blueprint.** Hero (straight-on) and Flat Lay
  (overhead) preserve the polar geometry, so a cluster's degree placement and a
  silence arc can be checked against the blueprint that specified them. The
  off-axis angles foreshorten exactly those angles — they are commerce shots, and
  the UI marks the difference with a ◆.
- **Named colors are locked.** A blue hydrangea gets `(true saturated blue)` in
  the machine prompt and a front-loaded color-lock line in the prose one, because
  v7 otherwise drifts an outlier color toward the warm palette the rest of the
  prompt implies.

### Accuracy validator

`src/lib/validator.ts` scores a prompt out of 100 across nine structural checks —
subject position, material vocabulary, `--ar`, `--style raw`, descriptive length,
lighting, background, banned realism keywords, and v7 parameter syntax.

One thing worth knowing about it: it is **deliberately strict**, and the
composer's own blueprint output does not ace it (~70, "Workable"). The machine
prompt names the product at word 8 rather than within the first 6, and the camera
layer made prompts longer, not shorter — well past the 15–40 word target. That's
the validator flagging a real tension between "say everything the build needs"
and "keep every token weighted", not a bug in either. The compiler has not been
retuned to flatter its own scorer.

### Building the single file

`npm run build:single` runs the Vite build, inlines the result with
`scripts/bundle-single-file.mjs`, and then **opens the result from `file://` and
fails if it doesn't mount** (`scripts/verify-single-file.mjs`).

That last step is not ceremony. The single-file bundle is a *different artifact*
from what a dev server serves, produced by a different script — and a bug in
that script once shipped a blank screen while every test passed, because the
tests ran against `vite preview`, which serves the real asset files. The bundler
was inserting the JS with a string `String.replace`, which interprets `$&` as
"the matched text"; the engine's own regex-escape helper contains `'\\$&'`, so it
became `'\\</body>'` and the bundle stopped parsing. Content is now inserted with
a function replacer, and the guard reproduces the failure if that ever regresses.

The rule: verify the artifact you hand over, over the protocol it will be opened
with.

### Starting state

The archive starts empty. Records written before the camera layer are cleared
once, on first load, by the schema stamp in `src/lib/storage.ts` — a prompt saved
by an earlier build describes a shot the engine no longer makes, and a library
where two entries claim the same format while only one is true is worse than an
empty one. The API key survives the reset, and the reason is shown once in a
notice.

---

## API key

Both tools call the Anthropic Messages API **directly from the browser** on
`claude-opus-5`. Your key is stored in this browser's `localStorage` and is sent
nowhere except to Anthropic.

That means it is readable by anything else running on the same origin. Use a key
you can rotate, and don't deploy this to a shared host with a key baked in — this
shape is intended for a single operator running their own studio. If it ever
needs to be multi-user, the call in `src/lib/claude.ts` should move behind a
server route holding the key in an environment variable.

---

## Data

`public/moodoor-inventory.json` is the EFS-1.0 canon: 43 species / 551 SKUs, with
per-SKU price, colour, hex, role and recommended quantity, and per-species
primary/secondary emotion, wheel sector, intensity range, texture archetype and
seasonality.

It is cached in `localStorage` on first load, because the Operator Console
decrements quantities against that copy as SKUs are committed to a build.

`src/lib/evs.ts` projects a recipe onto the 7-axis EVS grid — each material
contributes in proportion to its quantity share, with a species' primary emotion
carrying 65% of that weight and its secondary the other 35%. `driftCheck()`
compares predicted against observed and flags any axis differing by more than
0.15.

---

## Layout

```
src/
  types/       Inventory (EFS-1.0), LibraryItem/EVS/blueprint, generated packages
  data/        The canon: 32 product forms, per-form render language, system prompts
  lib/         claude · storage · inventory · evs · recipes · prompts · composer · validator
  components/  Topbar, SettingsDialog
  pages/       BriefGenerator, PromptLibrary
  styles/      tokens.css (design tokens), app.css (shell)
scripts/
  smoke.ts     Engine checks against the real canon — no browser, no API
```

The design tokens in `src/styles/tokens.css` are the Evercrafted system —
Cormorant Garamond / Inter / DM Mono, the green-and-amber palette — carried over
from the prototypes.

---

## Not built

The handoff describes eleven pages. These two are implemented; the rest are not,
and links to them are absent rather than broken. The shared data layer is built
to the full contract, so `observed_evs`, `territory` and `story_id` are typed and
persisted even though nothing writes them yet — Studio, Collection Engine and
Stories Studio would slot in against the same records.
