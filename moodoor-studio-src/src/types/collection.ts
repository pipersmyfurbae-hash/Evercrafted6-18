/** Shapes returned by the Collection Intelligence Engine system prompts. */

export interface PaletteEntry {
  name: string;
  hex: string;
  role?: string;
  pct?: string;
}

export interface SpecLine {
  label: string;
  value: string;
}

export interface HierarchyProduct {
  role: string;
  name: string;
  form: string;
  formula: string;
  scale: string;
  price: number;
  keyMaterials: string;
  notes: string;
}

export interface ReleasePhase {
  phase: string;
  title: string;
  timing: string;
  releases: string;
  purpose: string;
  copy: string;
}

export interface CrossSellFlow {
  name: string;
  flow: string;
}

export interface BundleSpec {
  name: string;
  type: string;
  contents: string;
  sum: number;
  discount: number;
}

export interface Continuity {
  atmosphere?: string;
  palette?: string;
  movement?: string;
  texture?: string;
  bridgeTone?: string;
}

/** Bespoke + mood/theme modes: the fixed 8-product hierarchy package. */
export interface CollectionPackage {
  collectionName?: string;
  tagline?: string;
  atmosphereArchetype?: string;
  emotionalBrief?: string;
  palette?: (PaletteEntry | string)[];
  signatureSpec?: SpecLine[];
  emotionTags?: string[];
  hierarchy?: HierarchyProduct[];
  priceRange?: { low?: number; high?: number; center?: number };
  continuity?: Continuity;
  releasePhases?: ReleasePhase[];
  crossSell?: CrossSellFlow[];
  bundles?: BundleSpec[];
  heroRenderPrompt?: string;
  heroGenome?: string;
  merchandising?: string[];
}

export interface WholehomeProduct {
  formCode: string;
  name: string;
  role: string;
  layer: number;
  scale: string;
  formula: string;
  price: string;
}

export interface FloralHierarchy {
  tier1Signature?: string;
  tier2Supporting?: string[];
  tier3Discovery?: string[];
}

/** Whole-home mode: products selected from the 32-form library. */
export interface WholehomePackage {
  collectionName?: string;
  season?: string;
  atmosphere?: string;
  priceRange?: string;
  palette?: string[];
  sightlineStory?: string;
  floralHierarchy?: FloralHierarchy;
  selectedForms?: string[];
  products?: WholehomeProduct[];
}

/**
 * What a generation actually returns. The two system prompts disagree on a few
 * field shapes — `priceRange` is a `{low, high, center}` object in the
 * hierarchy package and a plain string in the whole-home one, and `palette`
 * carries hex entries in the first but bare names in the second — so those are
 * widened here rather than intersected into something unusable.
 */
export type GeneratedPackage = Omit<CollectionPackage, 'priceRange' | 'palette'> &
  Omit<WholehomePackage, 'priceRange' | 'palette'> & {
    priceRange?: { low?: number; high?: number; center?: number } | string;
    palette?: (PaletteEntry | string)[];
  };

export type BriefMode = 'bespoke' | 'collection' | 'wholehome';
