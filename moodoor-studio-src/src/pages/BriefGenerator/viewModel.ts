import type { BriefMode, GeneratedPackage, PaletteEntry } from '../../types/collection';
import type { LibraryItem } from '../../types/library';
import { resolveForm } from '../../data/productLibrary';
import { buildCollectionBouquetPrompt, buildHeroPrompt } from '../../lib/prompts';
import { peekInventory } from '../../lib/inventory';

export const ROLE_COLORS: Record<string, string> = {
  'Premium Anchor': '#2A3D28',
  Hero: '#C4922A',
  Supporting: '#4A6741',
  'Atmospheric Filler': '#6B8F67',
  Gateway: '#8A5A3A',
  Accent: '#787058',
};

export const PHASE_TEXT = [
  'Profiling emotional atmosphere',
  'Generating palette and signature spec',
  'Building 8-product hierarchy',
  'Mapping continuity threads',
  'Writing MJ V7 render prompt',
];

export const TABS: [string, string][] = [
  ['collection', 'Collection'],
  ['hierarchy', 'Hierarchy'],
  ['continuity', 'Continuity'],
  ['release', 'Release'],
  ['crosssell', 'Cross-Sell'],
  ['render', 'Render'],
];

export const WH_TABS: [string, string][] = [
  ['collection', 'Collection'],
  ['wholehome', 'Selected Products'],
  ['render', 'Render'],
];

export interface RenderPreview {
  prompt: string;
  /** Which item the preview was built from, when it previews a real recipe. */
  sourceName?: string;
}

/**
 * Flatten the generated package into everything the results view renders.
 * Prices and discounts are resolved here so the components stay presentational.
 */
export function buildViewModel(d: GeneratedPackage, mode: BriefMode, items: LibraryItem[]) {
  const palette: PaletteEntry[] = (d.palette ?? []).map((p) =>
    typeof p === 'string'
      ? { name: p, hex: '#B7A98C', pct: '' }
      : { name: p.name, hex: p.hex, pct: p.pct ?? '' },
  );

  const hierarchy = (d.hierarchy ?? []).map((item) => ({
    role: item.role,
    name: item.name,
    form: item.form,
    formula: item.formula || '—',
    scale: item.scale,
    notes: item.notes || '',
    priceText: item.price ? `$${item.price}` : '—',
    borderColor: ROLE_COLORS[item.role] ?? ROLE_COLORS.Accent,
  }));

  const pr = d.priceRange && typeof d.priceRange === 'object' ? d.priceRange : {};
  const c = d.continuity ?? {};

  const threads = (
    [
      ['Thread 1 — Atmosphere', c.atmosphere],
      ['Thread 2 — Palette Rhythm', c.palette],
      ['Thread 3 — Movement', c.movement],
      ['Thread 4 — Texture', c.texture],
      ['Bridge Tone', c.bridgeTone],
    ] as [string, string | undefined][]
  )
    .filter(([, v]) => !!v)
    .map(([name, body]) => ({ name, body: body as string }));

  const bundles = (d.bundles ?? []).map((b) => {
    const disc = b.discount || 0;
    const sum = b.sum || 0;
    const final = disc > 0 ? Math.round(sum * (1 - disc)) : sum;
    const save = sum - final;
    return {
      name: b.name,
      type: b.type,
      contents: b.contents,
      hasDiscount: disc > 0 && save > 0,
      sum,
      final,
      save,
      discPct: Math.round(disc * 100),
    };
  });

  const whProducts = (d.products ?? []).map((p) => {
    const resolved = resolveForm(p);
    return { ...resolved, borderColor: ROLE_COLORS[resolved.role] ?? ROLE_COLORS.Accent };
  });

  return {
    atmo: d.atmosphereArchetype || d.atmosphere || '',
    name: d.collectionName || '',
    tagline: d.tagline || (typeof d.priceRange === 'string' ? d.priceRange : '') || '',
    emotionalBrief: d.emotionalBrief || '',
    palette,
    spec: d.signatureSpec ?? [],
    tags: d.emotionTags ?? [],
    season: d.season || '',
    floralHierarchy: d.floralHierarchy ?? null,
    hierarchy,
    priceRangeText: `$${pr.low ?? '—'} – $${pr.high ?? '—'}`,
    priceCenterText: `$${pr.center ?? '—'}`,
    threads,
    phases: d.releasePhases ?? [],
    crossSell: d.crossSell ?? [],
    bundles,
    render: buildRenderPreview(d, mode, items),
    heroGenome: mode === 'wholehome' ? '' : d.heroGenome || '',
    merchandising: d.merchandising ?? [],
    sightlineStory: d.sightlineStory || '',
    whProducts,
    selectedForms: (d.selectedForms ?? []).join(', '),
    renderTabTitle:
      mode === 'wholehome' ? 'Collection Bouquet Render Prompt' : 'Hero MJ V7 Render Prompt',
  };
}

/**
 * The Render tab previews a *production* prompt, not a separately-written
 * concept one — it runs item 1 through the same engine the Prompt Library uses,
 * so what you see here is what you'd get downstream. Whole-home has no single
 * hero product, so it keeps the collection-level bouquet shot instead.
 */
function buildRenderPreview(
  d: GeneratedPackage,
  mode: BriefMode,
  items: LibraryItem[],
): RenderPreview {
  if (mode === 'wholehome') {
    return { prompt: buildCollectionBouquetPrompt(items, d.palette) };
  }

  const first = items[0];
  if (!first) {
    // Inventory unavailable, so no recipe was sourced to preview.
    return { prompt: d.heroRenderPrompt || '' };
  }

  return {
    prompt: buildHeroPrompt(first, 'hero', peekInventory()),
    sourceName: first.recipe_name,
  };
}

export type BriefViewModel = ReturnType<typeof buildViewModel>;
