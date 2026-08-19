import type { Inventory, InventorySku, InventorySpecies, PrimaryRole } from '../types/inventory';
import { seasonsOf } from '../types/inventory';

/**
 * Matching a brief to real stock.
 *
 * This exists because material selection used to be `Math.random()` over the
 * whole register, filtered by role and nothing else. The species the generation
 * actually named for a collection — `keyMaterials` — were read only to detect
 * zero-stock gaps and then thrown away, so "London, Ralph Lauren, Christmas"
 * and "late autumn harvest" drew from the same hat. Every downstream layer was
 * faithfully rendering flowers nobody chose.
 *
 * The canon carries `seasonality`, `primary_emotion`, `secondary_emotion` and a
 * per-SKU `hex`. All four are signals; none of them were being read.
 */

/** What the generation said this collection is, in the shapes the canon speaks. */
export interface BriefContext {
  /** One of the canon's five seasonality values, or undefined if unresolved. */
  season?: string;
  /** Emotion labels from the package, matched against the species wheel. */
  emotions?: string[];
  /** Palette hexes, matched against SKU colour. */
  palette?: string[];
  /** The species this specific product was written around. */
  keyMaterials?: string;
}

export const CANON_SEASONS = ['spring', 'summer', 'fall', 'winter'] as const;

/**
 * Read a season out of free text — the brief, the package's season field, a
 * collection name. Holidays are the strongest everyday signal and the one the
 * old code had no way to hear: "Christmas" never looked like "winter".
 */
export function normalizeSeason(...texts: (string | undefined)[]): string | undefined {
  const t = texts.filter(Boolean).join(' ').toLowerCase();
  if (!t) return undefined;

  const rules: [RegExp, string][] = [
    [/christmas|yule|noel|holiday|advent|hanukkah|new year|december|january|february|snow|frost|midwinter|winter/, 'winter'],
    [/thanksgiving|halloween|harvest|autumn|\bfall\b|september|october|november/, 'fall'],
    [/easter|spring|march|april|may\b|bloom|thaw/, 'spring'],
    [/summer|june|july|august|midsummer/, 'summer'],
  ];
  for (const [re, season] of rules) if (re.test(t)) return season;
  return undefined;
}

/* ------------------------------------------------------------------ *
 * Colour
 * ------------------------------------------------------------------ */

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Perceptually-weighted RGB distance, normalised to roughly [0, 1]. */
export function colorDistance(a: string, b: string): number {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return 1;
  const dr = ra[0] - rb[0];
  const dg = ra[1] - rb[1];
  const db = ra[2] - rb[2];
  // Weights approximate the eye's green bias; good enough to rank swatches.
  return Math.min(1, Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db) / 764);
}

/* ------------------------------------------------------------------ *
 * Scoring
 * ------------------------------------------------------------------ */

/**
 * Weights are engineering defaults, not calibrated design law. The one thing
 * that is deliberate rather than tuned: a name the generation wrote outranks
 * every inferred signal, because it is a choice rather than an inference.
 */
export const SELECTION_WEIGHTS = {
  namedExact: 100,
  namedPartial: 45,
  seasonExact: 30,
  seasonYearRound: 12,
  seasonMismatch: -25,
  emotionPrimary: 20,
  emotionSecondary: 10,
  paletteMax: 25,
} as const;

const STOPWORDS = new Set(['stem', 'sprig', 'bough', 'leaf', 'berry', 'vine', 'bloom', 'bud']);

/** Content words of a species name, for partial matching ("peony", "hydrangea"). */
function nameTokens(species: string): string[] {
  return species
    .toLowerCase()
    .replace(/[^a-z\s']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

export function scoreSpecies(sp: InventorySpecies, ctx: BriefContext): number {
  const w = SELECTION_WEIGHTS;
  let score = 0;

  const named = (ctx.keyMaterials ?? '').toLowerCase();
  if (named) {
    if (named.includes(sp.species.toLowerCase())) score += w.namedExact;
    else if (nameTokens(sp.species).some((tok) => named.includes(tok))) score += w.namedPartial;
  }

  if (ctx.season) {
    // A stem may legitimately read for more than one season; the best of its
    // seasons is what counts, not the first one listed.
    const seasons = seasonsOf(sp);
    if (seasons.includes(ctx.season)) score += w.seasonExact;
    else if (seasons.includes('year-round') || !seasons.length) score += w.seasonYearRound;
    else score += w.seasonMismatch;
  }

  const emotions = (ctx.emotions ?? []).map((e) => e.toLowerCase());
  if (emotions.length) {
    const primary = (sp.primary_emotion ?? '').toLowerCase();
    const secondary = (sp.secondary_emotion ?? '').toLowerCase();
    // Imported registers carry free-form tags instead of the two canon
    // emotions, so both vocabularies are matched rather than one being lost.
    const tags = (sp.emotion_tags ?? []).map((t) => t.toLowerCase());
    if (emotions.includes(primary)) score += w.emotionPrimary;
    else if (emotions.includes(secondary) || tags.some((t) => emotions.includes(t)))
      score += w.emotionSecondary;
  }

  return score;
}

/** How close this SKU's colour sits to the collection palette. */
export function scoreSku(sku: InventorySku, ctx: BriefContext): number {
  const palette = (ctx.palette ?? []).filter(Boolean);
  if (!palette.length) return 0;
  const nearest = Math.min(...palette.map((p) => colorDistance(sku.hex, p)));
  return (1 - nearest) * SELECTION_WEIGHTS.paletteMax;
}

/* ------------------------------------------------------------------ *
 * Deterministic randomness
 * ------------------------------------------------------------------ */

/**
 * Seeded RNG. Sourcing used to call `Math.random()`, so the same brief produced
 * different stock every run and nothing could be reproduced or tested.
 */
export function makeRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export interface Pick {
  species: InventorySpecies;
  sku: InventorySku;
}

/**
 * Best available match for one slot.
 *
 * Chooses from the top few candidates rather than the single best, so eight
 * products in one collection don't all reach for the same stem — variety inside
 * the brief instead of variety instead of it. `exclude` keeps a single recipe
 * from naming one species three times.
 */
export function pickScoredSku(
  inv: Inventory,
  opts: {
    role?: PrimaryRole;
    ctx?: BriefContext;
    rng?: () => number;
    exclude?: Set<string>;
    /** How wide to sample; 1 is strictly the best match. */
    spread?: number;
  } = {},
): Pick | null {
  const { role, ctx = {}, rng = Math.random, exclude, spread = 3 } = opts;

  const available = (inv.species ?? []).filter((s) => (s.sku_count ?? 0) > 0 && s.skus?.length);
  if (!available.length) return null;

  const roleMatches = role
    ? available.filter((s) => s.skus.some((k) => k.primary_role === role))
    : available;
  const pool = roleMatches.length ? roleMatches : available;

  const fresh = exclude ? pool.filter((s) => !exclude.has(s.species)) : pool;
  const candidates = fresh.length ? fresh : pool;

  const ranked = candidates
    .map((species) => ({ species, score: scoreSpecies(species, ctx) }))
    .sort((a, b) => b.score - a.score);

  // Ties are common — a whole band of species can share a score — so the sample
  // window is widened to cover every candidate level with the top one.
  const window = Math.max(1, Math.min(spread, ranked.length));
  const cutoff = ranked[window - 1].score;
  const top = ranked.filter((r) => r.score >= cutoff);
  const species = top[Math.floor(rng() * top.length)].species;

  const ofRole = role ? species.skus.filter((k) => k.primary_role === role) : species.skus;
  const skus = ofRole.length ? ofRole : species.skus;

  // Colour is a SKU-level property, so the palette is applied here rather than
  // above: the right species in the wrong colourway is still the wrong stem.
  const rankedSkus = skus
    .map((sku) => ({ sku, score: scoreSku(sku, ctx) }))
    .sort((a, b) => b.score - a.score);
  const skuWindow = Math.max(1, Math.min((ctx.palette ?? []).length ? 2 : skus.length, rankedSkus.length));
  const sku = rankedSkus[Math.floor(rng() * skuWindow)].sku;

  return { species, sku };
}
