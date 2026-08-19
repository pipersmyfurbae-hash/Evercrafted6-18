import type { PrimaryRole } from './inventory';
import type { ShotKey } from '../data/cameras';

/** The seven EVS axes, in canonical order. */
export const EVS_AXES = [
  'warmth',
  'energy',
  'nostalgia',
  'valence',
  'intimacy',
  'restraint',
  'seasonal',
] as const;

export type EvsAxis = (typeof EVS_AXES)[number];
export type EvsVector = Record<EvsAxis, number>;

/** One SKU committed to a recipe, denormalized so a LibraryItem stands alone. */
export interface Material {
  sku: string;
  species: string;
  canon_id: string;
  color_name: string;
  primary_hex: string;
  price: number;
  primary_role: PrimaryRole;
  qty: number;
}

/** The six camera angles plus the greenery base pass. */
export type FormPrompts = Partial<Record<ShotKey, string>> & { greenery?: string };

/** Blueprint written back onto a LibraryItem once the Prompt Library compiles it. */
export interface FormBlueprint {
  form_code: string;
  prompts: FormPrompts;
  generated_at: string;
}

/**
 * The record every Moodoor tool reads and patches, keyed by `id` in
 * localStorage under `moodoor_library_items`.
 */
export interface LibraryItem {
  id: string;
  recipe_name: string;
  materials: Material[];
  cost_estimate: number;
  emotional_tags: string[];
  /** Derived from the recipe's own species mix, before anything is rendered. */
  predicted_evs: EvsVector;
  /** Read back off the render by Moodoor Studio; canonical once present. */
  observed_evs?: EvsVector;
  territory?: string;
  /** Canon seasonality the collection resolved to, when one could be read. */
  season?: string;
  /** Palette names from the collection, carried into the render prompts. */
  palette?: string[];
  blueprint?: FormBlueprint | PromptEntry;
  render_image?: string | null;
  story_id?: string | null;
  source_role?: string;
  source_layer?: number;
  form_code?: string;
  greener_only?: boolean;
  collection_name?: string;
}

/** An archived prompt in the Prompt Library, keyed under `moodoor_prompt_library`. */
export interface PromptEntry {
  id: string;
  title: string;
  subtitle: string;
  formula: string;
  season: string;
  size: string;
  seed: number;
  emotionalTags: string[];
  substrate: string;
  florals: string[];
  foliage: string[];
  silenceArc: string;
  machinePrompt: string;
  humanPrompt: string;
  /** The full camera set. Absent on entries saved before the camera layer. */
  shots?: Partial<Record<ShotKey, string>>;
  params: string;
  createdAt: string;
}

/** EC_WR_V2 — the canonical wreath blueprint the Composer accepts as JSON. */
export interface BlueprintStem {
  name?: string;
  item_id?: string;
  qty: number;
}

export interface BlueprintCluster {
  cluster_id?: string;
  type?: string;
  angle_deg?: number;
  radius_norm?: number;
  stems?: BlueprintStem[];
}

export interface FoliageSweep {
  name?: string;
  item_id?: string;
  arc_from?: number;
  arc_to?: number;
  arc_hard_stop_deg?: number;
}

export interface SilenceArc {
  from_deg: number;
  to_deg: number;
  enforcement?: string;
  label?: string;
}

export interface Blueprint {
  blueprint_id?: string;
  formula?: string;
  seed?: number;
  emotional_tags?: string[];
  /** Collection context, so a compiled prompt can say what season it is. */
  season?: string;
  palette?: string[];
  canvas?: { diameter_in?: number };
  silence_arcs?: SilenceArc[];
  clusters?: BlueprintCluster[];
  foliage_sweeps?: FoliageSweep[];
  /** Set by the Composer's Product form dropdown; drives all form language. */
  form_code?: string;
  formCode?: string;
  product_form_code?: string;
}
