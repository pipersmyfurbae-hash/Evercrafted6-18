/**
 * EFS-1.0 floral canon — the shape of `public/moodoor-inventory.json`.
 * 43 species / 551 SKUs. Five species carry `sku_count: 0` and are surfaced as
 * "register gaps" whenever a generated recipe references them by name.
 */

export type PrimaryRole = 'focal' | 'secondary' | 'accent' | 'foliage' | 'filler';

/** The ten emotion labels the EVS projection understands. */
export type Emotion =
  | 'comfort'
  | 'joy'
  | 'nostalgia'
  | 'renewal'
  | 'connection'
  | 'reverence'
  | 'celebration'
  | 'melancholy'
  | 'tenderness'
  | 'wonder';

export interface InventorySku {
  sku: string;
  color_name: string;
  hex: string;
  price: number;
  primary_role: PrimaryRole;
  qty_on_hand: number;
  recommended_qty_24in: number;
  /** Supplier fields, carried through an import so a pick traces to a product. */
  color_family?: string;
  product_url?: string;
  image_url?: string;
}

/**
 * What a record is for. Only `material` is selectable as a stem: a base is the
 * thing you build *on*, and a finished good is already a product.
 */
export type ItemClass = 'material' | 'base' | 'finished';

export interface InventorySpecies {
  canon_id: string;
  species: string;
  primary_emotion: Emotion;
  secondary_emotion: Emotion;
  wheel_sector: string;
  intensity_range: [number, number];
  texture_archetype: string;
  /**
   * One canon season, or several. An imported register can legitimately say a
   * stem reads both fall and winter; the built-in canon says exactly one.
   */
  seasonality: string | string[];
  sku_count: number;
  skus: InventorySku[];
  /** Free-form register tags, matched alongside the two canon emotions. */
  emotion_tags?: string[];
  item_class?: ItemClass;
  /** Base records only: what you would build on. */
  base_form?: string;
  base_material?: string;
  core_material?: string;
  pre_greened?: boolean;
  diameter_in?: number;
  length_in?: number;
  form_factor?: string;
  stem_length_in?: number;
  /** Fields the source flagged as inferred rather than verified. */
  needs_review?: string[];
}

/** Every season a species reads as, normalised to a list. */
export function seasonsOf(sp: { seasonality?: string | string[] }): string[] {
  const s = sp.seasonality;
  if (!s) return [];
  return (Array.isArray(s) ? s : [s]).map((x) => String(x).toLowerCase());
}

export interface Inventory {
  schema: string;
  generated_at: string;
  species_count: number;
  sku_count_total: number;
  /** Canon species carried at zero stock — never selected, always reported. */
  register_gaps: string[];
  species: InventorySpecies[];
  /** Set when the register came from an import rather than the built-in canon. */
  source_label?: string;
}
