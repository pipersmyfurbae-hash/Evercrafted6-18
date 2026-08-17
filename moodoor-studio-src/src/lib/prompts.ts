import type { Inventory } from '../types/inventory';
import type { LibraryItem, Material } from '../types/library';
import { FORM_LANGUAGE, PRODUCT_FORMS, type FormLanguage } from '../data/formLanguage';
import { SHOTS, SHOT_BY_KEY, type CameraShot, type ShotKey } from '../data/cameras';
import { peekInventory } from './inventory';
import { composeRing, describeComposition } from './placement';
import { makeRng, pickScoredSku, type BriefContext } from './selection';

/**
 * The Midjourney v7 render-prompt engine. Both the Brief Generator's hero
 * preview and the Prompt Library's production prompts run through here, so the
 * two can never describe the same item differently.
 *
 * v7 has no `::` multi-prompt weighting and no `--q` — emphasis comes from word
 * order and explicit dominance language instead.
 */

/** Stem counts read as designed, not counted, when they're odd. */
export function enforceOddCount(qty: number): number {
  const n = Math.max(1, Math.round(qty));
  return n % 2 === 0 ? n + 1 : n;
}

export function materialDesc(m: Material): string {
  return `${m.species} — ${m.color_name}`;
}

/**
 * Bloom-vs-greenery is decided from the species canon, not the per-SKU
 * `primary_role` tag — that tag frequently marks dahlias and roses as foliage,
 * which would silently strip every bloom out of a prompt.
 */
export const FOLIAGE_SPECIES = new Set([
  'Grey Lichen',
  'Blue Cedar',
  'Toasted Oak Leaf',
  'Seeded Eucalyptus',
  'Wild Ivy',
  'Bare Willow',
  'Silver Sage',
  'Sage Eucalyptus',
  'Dusty Miller',
  'Magnolia Leaf',
  'Boxwood Sprig',
  'Pine Bough',
  'Fir Sprig',
  'Wild Fern',
  'Golden Wheat Stem',
  'Dried Pampas',
  'Bittersweet Vine',
  "Lamb's Ear",
]);

export function isFoliage(m: Material): boolean {
  return FOLIAGE_SPECIES.has(m.species);
}

/** Unlabelled roles default to secondary rather than dropping out entirely. */
export function roleOf(m: Material): 'focal' | 'secondary' | 'accent' {
  const r = m.primary_role;
  return r === 'focal' || r === 'secondary' || r === 'accent' ? r : 'secondary';
}

const WREATH_FALLBACK: FormLanguage = {
  noun: 'wreath',
  base: 'grapevine ring wreath',
  mount: 'wall-mounted, full wreath in frame',
  setting: 'pale warm grey textured plaster wall',
  light: 'soft daylight from upper left',
  negative_space:
    "right arc 1:30 to 5:30 o'clock completely bare dark brown grapevine — intentional structural feature not a gap",
};

export interface ResolvedFormLanguage extends FormLanguage {
  /** "48-60in, Linear Directional construction" — straight from the canon. */
  spec: string;
  /** The ribbon rule for this form; explicit in both directions. */
  ribbon: string;
}

/** Merge per-form prose with the product canon so scale and bow can't drift. */
export function formLang(formCode?: string): ResolvedFormLanguage {
  const base = (formCode && FORM_LANGUAGE[formCode]) || WREATH_FALLBACK;
  const spec = formCode ? PRODUCT_FORMS[formCode] : undefined;
  if (!spec) return { ...base, spec: '', ribbon: '' };

  return {
    ...base,
    spec: `${spec.scale}, ${spec.formula} construction`,
    ribbon: spec.bow
      ? 'finished with a single hand-tied ribbon bow, tails falling naturally'
      : spec.ribbon_tail
        ? 'a single ribbon tail, no bow'
        : 'no bow, no ribbon',
  };
}

/**
 * Drop any `--no` token the piece actually uses as a designed material —
 * telling Midjourney "no ivy" on an ivy cascade fights the prompt's own subject.
 */
export function cleanNegatives(
  list: string[],
  mats: Pick<Material, 'species' | 'color_name'>[],
  fl?: Partial<ResolvedFormLanguage>,
): string[] {
  const named = (mats ?? [])
    .map((m) => `${m.species ?? ''} ${m.color_name ?? ''}`.toLowerCase())
    .join(' ');
  const drop = (fl?.drop_negatives ?? []).map((t) => t.toLowerCase());
  if (fl?.ribbon && /hand-tied ribbon bow/.test(fl.ribbon)) drop.push('bow', 'ribbon');
  return list.filter((t) => !named.includes(t.toLowerCase()) && !drop.includes(t.toLowerCase()));
}

/** Phase 1 — the greenery-only base pass, for forms that carry no blooms. */
export function buildGreeneryBase(item: LibraryItem): string {
  const fl = formLang(item.form_code);
  const foliage = (item.materials ?? []).filter(isFoliage);
  const used = foliage.length ? foliage : (item.materials ?? []);
  const list = used.map(materialDesc).join(', ');
  const neg = cleanNegatives(
    ['berries', 'pods', 'seeds', 'florals', 'flowers', 'dark background', 'full coverage', 'ivy', 'symmetry'],
    used,
    fl,
  ).join(', ');

  const body = [
    `luxury handcrafted faux botanical ${fl.base}`,
    'home decor product photography',
    'photorealistic commercial photograph',
    'real photograph not illustrated',
    fl.spec,
    'GREENERY ONLY no florals no berries no pods no seeds',
    list,
    fl.ribbon,
    fl.negative_space,
    'each stem at unique individual angle organic irregularity front-to-back layering',
    fl.setting,
    fl.light,
    fl.mount,
  ]
    .filter(Boolean)
    .join(', ');

  return `${body} --ar 1:1 --v 7 --style raw --s 50 --no ${neg}`;
}

/**
 * When an item arrives carrying only foliage (or nothing at all), pull real
 * in-stock blooms from the register so hero/variant/detail always name actual
 * flowers. Seeded off the item id, so re-opening an item gives identical picks.
 */
export function floralFallback(
  inv: Inventory | null,
  seedStr: string,
  ctx: BriefContext = {},
): Material[] {
  if (!inv) return [];

  // Foliage-only register aside, the substitute stems still have to belong to
  // the collection — a season-blind hash here would put wheat in a Christmas
  // wreath just as surely as random sourcing did upstream.
  const bloomsOnly: Inventory = {
    ...inv,
    species: (inv.species ?? []).filter((s) => s.sku_count > 0 && !FOLIAGE_SPECIES.has(s.species)),
  };
  if (!bloomsOnly.species.length) return [];

  const rng = makeRng(String(seedStr || 'moodoor'));
  const seen = new Set<string>();
  const roles: [Material['primary_role'], number][] = [
    ['focal', 3],
    ['secondary', 5],
    ['accent', 3],
  ];

  const out: Material[] = [];
  for (const [role, qty] of roles) {
    const pick = pickScoredSku(bloomsOnly, { role, ctx, rng, exclude: seen });
    if (!pick) continue;
    seen.add(pick.species.species);
    out.push({
      sku: pick.sku.sku,
      species: pick.species.species,
      canon_id: pick.species.canon_id,
      color_name: pick.sku.color_name,
      primary_hex: pick.sku.hex,
      price: pick.sku.price,
      primary_role: role,
      qty,
    });
  }
  return out;
}

/** Resolve the floral set once, so every shot in a set names the same stems. */
export function resolveMaterials(
  item: LibraryItem,
  inv?: Inventory | null,
  preMats?: Material[],
): Material[] {
  if (preMats) return preMats;
  const own = (item.materials ?? []).filter((m) => !isFoliage(m));
  return own.length
    ? own
    : floralFallback(inv ?? peekInventory(), item.id, {
        season: item.season,
        emotions: item.emotional_tags ?? [],
      });
}

/**
 * Everything that describes the *piece* rather than the photograph of it. This
 * string is built once and reused byte-identically across the whole shot set —
 * that identity is what makes six renders read as one wreath photographed six
 * ways rather than six different wreaths.
 */
export function buildSubject(item: LibraryItem, mats: Material[], shot?: CameraShot): string {
  const fl = formLang(item.form_code);

  const focalRaw = mats.filter((m) => roleOf(m) === 'focal');
  // Nothing survived as focal — promote the highest-qty bloom, so the
  // "focal cluster" direction always has something to point at.
  const focal = focalRaw.length
    ? focalRaw
    : mats.length
      ? [[...mats].sort((a, b) => (b.qty || 1) - (a.qty || 1))[0]]
      : [];
  const promoted = focalRaw.length ? null : focal[0];

  const secondary = mats.filter((m) => roleOf(m) === 'secondary' && m !== promoted);
  const accent = mats.filter((m) => roleOf(m) === 'accent' && m !== promoted);

  const clusterDesc = (arr: Material[], label: string) =>
    arr.length
      ? `${label}: ${arr.map((m) => `${enforceOddCount(m.qty)}x ${materialDesc(m)}`).join(', ')}`
      : '';

  const clusters = [
    clusterDesc(focal, 'FOCAL'),
    clusterDesc(secondary, 'SECONDARY'),
    clusterDesc(accent, 'ACCENT'),
  ]
    .filter(Boolean)
    .join(', ');

  // Assembled from parts and filtered, because a bespoke wreath carries no form
  // code and so has no `spec` or `ribbon` — interpolating those blind leaves
  // empty ", ," tokens that dilute the prompt.
  return [
    `luxury handcrafted faux botanical ${fl.noun}`,
    'home decor product photography',
    'photorealistic commercial photograph',
    'real photograph not illustrated',
    fl.spec,
    shot?.setting ?? fl.setting,
    fl.light,
    shot?.mount ?? fl.mount,
    fl.ribbon,
    item.season ? `${item.season} seasonal register` : '',
    (item.palette ?? []).length ? `palette of ${(item.palette ?? []).slice(0, 4).join(', ')}` : '',
    (item.emotional_tags ?? []).join(', '),
    clusters,
    'asymmetric directional composition, each stem unique angle organic irregularity',
    shot?.dropNegativeSpace ? '' : spatialLanguage(item, mats, fl),
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * Where the mass sits and what is left bare.
 *
 * A wreath is a ring, so its rest arcs are measured from the actual placement.
 * A coded form is not a circle — a mantel garland has no 4 o'clock — so it keeps
 * the per-form language from the canon instead of being forced through a polar
 * model that does not describe it.
 */
function spatialLanguage(
  item: LibraryItem,
  mats: Material[],
  fl: ResolvedFormLanguage,
): string {
  if (item.form_code) return fl.negative_space;
  return describeComposition(composeRing(item, mats)) || fl.negative_space;
}

const SUBJECT_NEGATIVES = [
  'symmetry',
  'bouquet',
  'centered',
  'fresh flowers',
  'wilting',
  'plastic shine',
  'craft store',
  'dark background',
];

/**
 * One shot: the shared subject, then the camera bundle, then params. The `--s`
 * value is deliberately constant across the set — varying stylize changes how
 * hard v7 reinterprets the subject, which is precisely the drift the locked
 * subject string exists to prevent.
 */
export function buildShotPrompt(
  item: LibraryItem,
  shot: CameraShot,
  inv?: Inventory | null,
  preMats?: Material[],
): string {
  const mats = resolveMaterials(item, inv, preMats);
  const subject = buildSubject(item, mats, shot);
  const neg = cleanNegatives(
    [...SUBJECT_NEGATIVES, ...(shot.extraNegatives ?? [])],
    mats,
    formLang(item.form_code),
  ).join(', ');

  return `${subject}, ${shot.camera} --ar ${shot.ar} --v 7 --style raw --s 100 --no ${neg}`;
}

/** The full six-angle set for one item, all describing the same resolved stems. */
export function buildShotSet(
  item: LibraryItem,
  inv?: Inventory | null,
  preMats?: Material[],
): Record<ShotKey, string> {
  const mats = resolveMaterials(item, inv, preMats);
  return Object.fromEntries(
    SHOTS.map((shot) => [shot.key, buildShotPrompt(item, shot, inv, mats)]),
  ) as Record<ShotKey, string>;
}

/** Back-compat entry point for callers that only want the single hero frame. */
export function buildHeroPrompt(
  item: LibraryItem,
  shotKey: ShotKey = 'hero',
  inv?: Inventory | null,
  preMats?: Material[],
): string {
  return buildShotPrompt(item, SHOT_BY_KEY[shotKey] ?? SHOTS[0], inv, preMats);
}

/**
 * The collection-level shot: the whole floral cast held in one hand. Whole-home
 * collections have no single hero product, so this stands in for the set.
 */
export function buildCollectionBouquetPrompt(
  items: LibraryItem[],
  palette?: (string | { name?: string })[],
): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const item of items ?? []) {
    for (const m of item.materials ?? []) {
      const key = (m.species ?? '').toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        parts.push(m.species);
      }
    }
  }

  const speciesDesc = parts.length
    ? parts.slice(0, 8).join(', ')
    : 'premium silk florals and faux botanicals in the collection palette';

  const paletteNames = (palette ?? [])
    .slice(0, 3)
    .map((p) => (typeof p === 'string' ? p : (p?.name ?? '')))
    .filter(Boolean);
  const paletteNote = paletteNames.length ? `palette: ${paletteNames.join(', ')}, ` : '';

  return `editorial lifestyle photograph of a hand-held luxury faux botanical bouquet, a woman's hand and forearm holding a loosely gathered arrangement, ${speciesDesc}, ${paletteNote}stems wrapped loosely in natural linen twine at the hand, bouquet held at a natural downward angle arm relaxed not posed, photographed against a pale warm grey textured plaster wall, soft north-facing window light from the left, bouquet in sharp focus hand softly blurred, florals at true natural scale nothing enlarged, 85mm f/1.8 medium format --ar 4:5 --v 7 --style raw --s 150 --no fresh flowers, wilting, dew, vase, plastic shine, bright colors, symmetrical, studio backdrop, cartoon, text, watermark`;
}

/** Build the full six-angle shot set for one item, plus the greenery base pass. */
export function buildFormPrompts(
  item: LibraryItem,
  inv: Inventory | null,
): { prompts: Record<string, string>; materials: Material[] } {
  // Resolve the floral set once so every angle names the same stems.
  const materials = resolveMaterials(item, inv);

  const prompts: Record<string, string> = buildShotSet(item, inv, materials);
  if (item.greener_only) prompts.greenery = buildGreeneryBase(item);

  return { prompts, materials };
}
