import type { Inventory, PrimaryRole } from '../types/inventory';
import type { LibraryItem, Material } from '../types/library';
import type { HierarchyProduct, WholehomeProduct } from '../types/collection';
import { PRODUCT_LIBRARY } from '../data/productLibrary';
import { materialFromPick, registerGapSpecies } from './inventory';
import { makeRng, normalizeSeason, pickScoredSku, type BriefContext } from './selection';
import { emotionalTagsFromMaterials, predictedEvsFromMaterials } from './evs';
import { newId } from './storage';

export interface RecipeResult {
  items: LibraryItem[];
  /** Zero-stock canon species the generated brief named by hand. */
  gaps: string[];
}

/** Which material tier a hierarchy role leads with. */
const ROLE_TO_TIER: Record<string, PrimaryRole> = {
  'Premium Anchor': 'focal',
  Hero: 'focal',
  Supporting: 'secondary',
  Gateway: 'secondary',
  'Atmospheric Filler': 'accent',
  Accent: 'accent',
};

const randInt = (rng: () => number, min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));

/**
 * Source one recipe's stems against the brief.
 *
 * Slots after the first drop the role filter so a recipe isn't three focals,
 * and `seen` stops one species being named twice in the same piece.
 */
function sourceMaterials(
  inv: Inventory,
  count: number,
  leadRole: PrimaryRole,
  ctx: BriefContext,
  rng: () => number,
  forceRole = false,
) {
  const materials: Material[] = [];
  const seen = new Set<string>();
  const roles: (PrimaryRole | undefined)[] = forceRole
    ? Array(count).fill(leadRole)
    : [leadRole, 'secondary', 'accent', 'secondary', 'accent'];

  for (let i = 0; i < count; i++) {
    const pick = pickScoredSku(inv, { role: roles[i] ?? undefined, ctx, rng, exclude: seen });
    if (!pick) continue;
    seen.add(pick.species.species);
    materials.push(materialFromPick(pick, randInt(rng, 1, 3)));
  }
  return materials;
}

/** Palette hexes, from either shape the two system prompts return. */
function paletteHexes(palette?: (string | { hex?: string })[]): string[] {
  return (palette ?? [])
    .map((p) => (typeof p === 'string' ? p : (p?.hex ?? '')))
    .filter((h) => /^#?[0-9a-f]{6}$/i.test(h));
}

function toLibraryItem(
  base: Omit<LibraryItem, 'cost_estimate' | 'predicted_evs' | 'emotional_tags'> & {
    materials: Material[];
  },
  inv: Inventory,
  fallbackTags: string[] = [],
): LibraryItem {
  // The brief's own register leads; what the chosen stems project follows. The
  // derived tags used to replace the brief's entirely, so a Christmas
  // collection could compile as "vitality, stillness" and never say
  // "celebration" — the words the operator actually asked for.
  const derived = emotionalTagsFromMaterials(base.materials, inv);
  const merged = [...new Set([...fallbackTags, ...derived])].slice(0, 5);
  return {
    ...base,
    cost_estimate: base.materials.reduce((a, m) => a + m.price * m.qty, 0),
    emotional_tags: merged.length ? merged : derived,
    predicted_evs: predictedEvsFromMaterials(base.materials, inv),
  };
}

/**
 * Turn the generated 8-product hierarchy into real LibraryItem recipes, sourced
 * only from in-stock SKUs. Zero-stock species the brief named by hand are
 * surfaced as register gaps rather than silently substituted.
 */
export function buildLibraryItems(
  pkg: {
    hierarchy?: HierarchyProduct[];
    collectionName?: string;
    emotionTags?: string[];
    season?: string;
    palette?: (string | { hex?: string; name?: string })[];
  },
  inv: Inventory,
  /** The operator's own words — the most reliable season signal there is. */
  briefText = '',
): RecipeResult {
  const gapNames = registerGapSpecies(inv).map((s) => s.species);
  const foundGaps = new Set<string>();
  const hierarchy = pkg.hierarchy ?? [];

  const season = normalizeSeason(pkg.season, briefText, pkg.collectionName);
  const palette = paletteHexes(pkg.palette);

  const items = hierarchy.map((h, i) => {
    for (const part of (h.keyMaterials ?? '').split(/[,;]/)) {
      for (const gap of gapNames) {
        if (part.toLowerCase().includes(gap.toLowerCase())) foundGaps.add(gap);
      }
    }

    // `keyMaterials` is what the generation actually chose for this product. It
    // used to be scanned for gaps and discarded; it is now the strongest signal
    // in the match, ahead of every inferred one.
    const ctx = {
      season,
      palette,
      emotions: pkg.emotionTags ?? [],
      keyMaterials: h.keyMaterials ?? '',
    };
    const rng = makeRng(`${pkg.collectionName ?? 'collection'}|${h.name ?? ''}|${i}`);
    const materials = sourceMaterials(inv, randInt(rng, 3, 5), ROLE_TO_TIER[h.role] ?? 'focal', ctx, rng);

    return toLibraryItem(
      {
        id: newId('LI'),
        recipe_name: h.name || `${pkg.collectionName ?? 'Collection'} ${h.role}`,
        materials,
        source_role: h.role,
        collection_name: pkg.collectionName ?? '',
        season,
        palette: paletteNames(pkg.palette),
      },
      inv,
      pkg.emotionTags ?? [],
    );
  });

  return { items, gaps: [...foundGaps] };
}

/** Palette names, for the render prompts to say out loud. */
function paletteNames(palette?: (string | { name?: string })[]): string[] {
  return (palette ?? [])
    .map((p) => (typeof p === 'string' ? p : (p?.name ?? '')))
    .filter(Boolean)
    .slice(0, 4);
}

/**
 * The whole-home equivalent: one recipe per selected form. Greenery-only forms
 * are sourced entirely from foliage, which is what makes their render prompts
 * take the greenery-base path downstream.
 */
export function buildWholehomeLibraryItems(
  pkg: {
    products?: WholehomeProduct[];
    collectionName?: string;
    season?: string;
    emotionTags?: string[];
    palette?: (string | { hex?: string; name?: string })[];
  },
  inv: Inventory,
  briefText = '',
): RecipeResult {
  const season = normalizeSeason(pkg.season, briefText, pkg.collectionName);
  const palette = paletteHexes(pkg.palette);

  const items = (pkg.products ?? []).map((p, i) => {
    const def = PRODUCT_LIBRARY[p.formCode];
    const greenerOnly = !!def?.greenerOnly;

    const leadRole: PrimaryRole = greenerOnly
      ? 'foliage'
      : def?.role === 'Hero' || def?.role === 'Premium Anchor'
        ? 'focal'
        : 'secondary';

    const ctx = { season, palette, emotions: pkg.emotionTags ?? [], keyMaterials: p.name ?? '' };
    const rng = makeRng(`${pkg.collectionName ?? 'wholehome'}|${p.formCode}|${i}`);
    const count = greenerOnly ? randInt(rng, 2, 3) : randInt(rng, 3, 5);
    const materials = sourceMaterials(inv, count, leadRole, ctx, rng, greenerOnly);

    return toLibraryItem(
      {
        id: newId('LI'),
        recipe_name: p.name || def?.name || p.formCode,
        materials,
        source_role: p.role || def?.role,
        source_layer: p.layer || def?.layer,
        form_code: p.formCode,
        collection_name: pkg.collectionName ?? '',
        greener_only: greenerOnly,
        season,
        palette: paletteNames(pkg.palette),
      },
      inv,
    );
  });

  return { items, gaps: [] };
}
