import type { Inventory, InventorySpecies, ItemClass, PrimaryRole } from '../types/inventory';

/**
 * Bringing your own register.
 *
 * The built-in EFS-1.0 canon is one shape; a supplier export is another. This
 * adapts a flat item list into the shape the engine reads, and — more
 * importantly — *reports what it found* rather than quietly coercing. An import
 * that silently drops half a catalogue is worse than one that refuses.
 */

export interface ImportedItem {
  item_id?: string;
  name?: string;
  source_sku?: string;
  product_url?: string;
  image_url_guess?: string;
  image_url?: string;
  color_hex?: string;
  color_name?: string;
  color_family?: string;
  status?: string;
  yield_per_unit?: number;
  cost_per_stem_usd?: number;
  emotion_tags?: string[];
  evs_emotion_tags?: string[];
  vision?: { seasonality?: string[] };
  seasonality?: string | string[];
  structural_roles?: string[];
  form_factor?: string;
  stem_length_in?: number;
  item_class?: string;
  base_form?: string;
  base_material?: string;
  core_material?: string;
  pre_greened?: boolean;
  diameter_in?: number;
  length_in?: number;
  _needs_review?: Record<string, string>;
}

export interface ImportReport {
  total: number;
  /** Selectable as stems. */
  materials: number;
  /** Bases you build on — never selected as a stem. */
  bases: number;
  /** Finished goods — excluded from the design engine entirely. */
  finished: number;
  inactive: number;
  skipped: number;
  roleCounts: Record<string, number>;
  seasonCounts: Record<string, number>;
  /** Things worth knowing before you trust a generation built on this. */
  warnings: string[];
  errors: string[];
}

export type ImportFormat = 'canon' | 'items' | 'unknown';

/** Which of the two shapes this is. */
export function detectFormat(data: unknown): ImportFormat {
  if (Array.isArray(data)) return data.length && typeof data[0] === 'object' ? 'items' : 'unknown';
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.species)) return 'canon';
    if (Array.isArray(o.items)) return 'items';
  }
  return 'unknown';
}

const ROLE_MAP: Record<string, PrimaryRole> = {
  focal: 'focal',
  hero: 'focal',
  anchor: 'focal',
  secondary: 'secondary',
  support: 'secondary',
  accent: 'accent',
  filler: 'filler',
  foliage: 'foliage',
  greenery: 'foliage',
};

const CANON_SEASONS = new Set(['spring', 'summer', 'fall', 'winter', 'year-round']);

function classOf(item: ImportedItem): ItemClass {
  const c = (item.item_class ?? '').toLowerCase();
  if (c === 'base' || c === 'finished') return c;
  return 'material';
}

function roleOf(item: ImportedItem): PrimaryRole {
  for (const r of item.structural_roles ?? []) {
    const mapped = ROLE_MAP[String(r).toLowerCase()];
    if (mapped) return mapped;
  }
  return 'secondary';
}

function seasonsOfItem(item: ImportedItem): string[] {
  const raw = item.vision?.seasonality ?? item.seasonality ?? [];
  const list = (Array.isArray(raw) ? raw : [raw]).map((s) => String(s).toLowerCase().trim());
  return list.filter((s) => CANON_SEASONS.has(s));
}

/** Title Case, because a register of SHOUTING SKU NAMES reads badly in a prompt. */
export function titleCase(name: string): string {
  return (name ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|[\s/('"-])([a-z])/g, (_, pre: string, ch: string) => pre + ch.toUpperCase());
}

/**
 * Adapt a flat supplier list.
 *
 * Each item becomes its own species carrying one SKU — these are distinct
 * products with one colourway each, so folding them into shared species would
 * invent a hierarchy the source does not have.
 */
export function importItems(items: ImportedItem[], label = 'Imported register'): {
  inventory: Inventory;
  report: ImportReport;
} {
  const report: ImportReport = {
    total: items.length,
    materials: 0,
    bases: 0,
    finished: 0,
    inactive: 0,
    skipped: 0,
    roleCounts: {},
    seasonCounts: {},
    warnings: [],
    errors: [],
  };

  const species: InventorySpecies[] = [];
  const seenIds = new Set<string>();
  let needsReview = 0;
  let missingColor = 0;
  let missingPrice = 0;

  items.forEach((item, i) => {
    const name = titleCase(item.name ?? '');
    const id = item.item_id ?? item.source_sku ?? `ITEM-${i + 1}`;
    if (!name) {
      report.skipped += 1;
      report.errors.push(`Row ${i + 1} has no name — skipped.`);
      return;
    }
    if (seenIds.has(id)) {
      report.skipped += 1;
      report.errors.push(`Duplicate id "${id}" — second copy skipped.`);
      return;
    }
    seenIds.add(id);

    const itemClass = classOf(item);
    const active = (item.status ?? 'active').toLowerCase() === 'active';
    if (!active) report.inactive += 1;

    if (itemClass === 'finished') report.finished += 1;
    else if (itemClass === 'base') report.bases += 1;
    else report.materials += 1;

    const role = roleOf(item);
    const seasons = seasonsOfItem(item);
    if (itemClass === 'material' && active) {
      report.roleCounts[role] = (report.roleCounts[role] ?? 0) + 1;
      for (const s of seasons.length ? seasons : ['unspecified']) {
        report.seasonCounts[s] = (report.seasonCounts[s] ?? 0) + 1;
      }
    }

    const tags = [...(item.evs_emotion_tags ?? []), ...(item.emotion_tags ?? [])].filter(Boolean);
    const review = Object.keys(item._needs_review ?? {});
    if (review.length) needsReview += 1;
    if (!item.color_hex) missingColor += 1;
    if (typeof item.cost_per_stem_usd !== 'number') missingPrice += 1;

    // `sku_count: 0` is how the engine marks something unselectable, so bases,
    // finished goods and discontinued lines all land there — present in the
    // register, never picked as a stem.
    const selectable = itemClass === 'material' && active;

    species.push({
      canon_id: id,
      species: name,
      primary_emotion: (tags[0] ?? '') as InventorySpecies['primary_emotion'],
      secondary_emotion: (tags[1] ?? '') as InventorySpecies['secondary_emotion'],
      wheel_sector: item.color_family ?? '',
      intensity_range: [0, 1],
      texture_archetype: item.form_factor ?? '',
      seasonality: seasons.length ? seasons : 'year-round',
      emotion_tags: tags,
      item_class: itemClass,
      base_form: item.base_form,
      base_material: item.base_material,
      core_material: item.core_material,
      pre_greened: item.pre_greened,
      diameter_in: item.diameter_in,
      length_in: item.length_in,
      form_factor: item.form_factor,
      stem_length_in: item.stem_length_in,
      needs_review: review,
      sku_count: selectable ? 1 : 0,
      skus: [
        {
          sku: item.source_sku ?? id,
          color_name: item.color_name ?? 'Unspecified',
          hex: item.color_hex ?? '#999999',
          price: item.cost_per_stem_usd ?? 0,
          primary_role: role,
          qty_on_hand: selectable ? Math.max(1, item.yield_per_unit ?? 1) : 0,
          recommended_qty_24in: Math.max(1, item.yield_per_unit ?? 1),
          color_family: item.color_family,
          product_url: item.product_url,
          image_url: item.image_url ?? item.image_url_guess,
        },
      ],
    });
  });

  const selectableCount = species.filter((s) => s.sku_count > 0).length;

  if (!selectableCount) {
    report.errors.push(
      'No selectable materials. Every row is a base, a finished good, or inactive — the engine would have nothing to build with.',
    );
  }
  if (!report.roleCounts.focal && selectableCount) {
    report.warnings.push(
      'No item is marked focal. Hero clusters will be promoted from the strongest available stem, so nothing breaks — but nothing in the register is declared as the thing the eye should land on.',
    );
  }
  for (const season of ['spring', 'summer', 'fall', 'winter']) {
    if (!report.seasonCounts[season]) {
      report.warnings.push(
        `Nothing reads as ${season}. A ${season} brief will fall back to year-round stock.`,
      );
    }
  }
  if (needsReview) {
    report.warnings.push(
      `${needsReview} item${needsReview === 1 ? '' : 's'} carr${needsReview === 1 ? 'ies' : 'y'} _needs_review flags — colour, length or material inferred rather than verified. Imported as-is.`,
    );
  }
  if (missingColor) {
    report.warnings.push(
      `${missingColor} item${missingColor === 1 ? ' has' : 's have'} no colour hex, so palette matching cannot rank ${missingColor === 1 ? 'it' : 'them'}. Falls back to neutral grey.`,
    );
  }
  if (missingPrice) {
    report.warnings.push(
      `${missingPrice} item${missingPrice === 1 ? ' has' : 's have'} no cost — recipes using ${missingPrice === 1 ? 'it' : 'them'} will under-report.`,
    );
  }

  return {
    inventory: {
      schema: 'moodoor-import/1',
      generated_at: new Date().toISOString(),
      species_count: species.length,
      sku_count_total: species.reduce((a, s) => a + s.skus.length, 0),
      register_gaps: [],
      species,
      source_label: label,
    },
    report,
  };
}

/** Parse and adapt whatever was pasted or dropped. Throws with a readable reason. */
export function importInventory(
  raw: string,
  label?: string,
): { inventory: Inventory; report: ImportReport; format: ImportFormat } {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`That is not valid JSON — ${(err as Error).message}`);
  }

  const format = detectFormat(data);
  if (format === 'canon') {
    const inv = data as Inventory;
    const selectable = (inv.species ?? []).filter((s) => s.sku_count > 0);
    return {
      inventory: { ...inv, source_label: label ?? 'Imported canon' },
      format,
      report: {
        total: inv.species?.length ?? 0,
        materials: selectable.length,
        bases: 0,
        finished: 0,
        inactive: (inv.species?.length ?? 0) - selectable.length,
        skipped: 0,
        roleCounts: {},
        seasonCounts: {},
        warnings: [],
        errors: [],
      },
    };
  }

  if (format === 'items') {
    const list = Array.isArray(data)
      ? (data as ImportedItem[])
      : ((data as { items: ImportedItem[] }).items ?? []);
    return { ...importItems(list, label), format };
  }

  throw new Error(
    'Unrecognised shape. Expected either an array of items, an object with an "items" array, or a canon file with a "species" array.',
  );
}

/** Bases in the register — what a build could sit on. */
export function basesOf(inv: Inventory): InventorySpecies[] {
  return (inv.species ?? []).filter((s) => s.item_class === 'base');
}

/* ------------------------------------------------------------------ *
 * Merging several files into one register
 * ------------------------------------------------------------------ */

export interface LoadedSource {
  label: string;
  inventory: Inventory;
  report: ImportReport;
}

/**
 * Fold several uploads into one register.
 *
 * Later files win on a collision, and every collision is reported — two
 * catalogues disagreeing about the same SKU is a fact the operator should see,
 * not something to resolve silently.
 */
export function mergeSources(sources: LoadedSource[]): {
  inventory: Inventory;
  collisions: string[];
} {
  const byId = new Map<string, InventorySpecies>();
  const collisions: string[] = [];

  for (const src of sources) {
    for (const sp of src.inventory.species ?? []) {
      if (byId.has(sp.canon_id)) collisions.push(`${sp.canon_id} (${sp.species}) — "${src.label}" wins`);
      byId.set(sp.canon_id, sp);
    }
  }

  const species = [...byId.values()];
  return {
    inventory: {
      schema: 'moodoor-import/1',
      generated_at: new Date().toISOString(),
      species_count: species.length,
      sku_count_total: species.reduce((a, s) => a + s.skus.length, 0),
      register_gaps: [],
      species,
      source_label: sources.map((s) => s.label).join(' + ') || 'Imported register',
    },
    collisions,
  };
}

/* ------------------------------------------------------------------ *
 * Filling the gaps with Claude
 * ------------------------------------------------------------------ */

/**
 * Everything a tagging pass could sensibly touch.
 *
 * Finished goods are excluded — they never enter the design engine, so tagging
 * them buys nothing. Bases stay in: they carry a look, and a re-tag can improve
 * what a prompt says about the thing a piece is built on.
 */
export function taggableSpecies(inv: Inventory): InventorySpecies[] {
  return (inv.species ?? []).filter((s) => s.item_class !== 'finished');
}

/** Items the engine can read, but not rank — no tags, or no season. */
export function untaggedSpecies(inv: Inventory): InventorySpecies[] {
  return (inv.species ?? []).filter((s) => {
    if (s.item_class === 'finished') return false;
    const noTags = !(s.emotion_tags ?? []).length && !s.primary_emotion;
    const noSeason = !seasonsOfSpecies(s).length;
    return noTags || noSeason;
  });
}

function seasonsOfSpecies(s: InventorySpecies): string[] {
  const raw = s.seasonality;
  return (Array.isArray(raw) ? raw : raw ? [raw] : []).filter((x) => CANON_SEASONS.has(String(x).toLowerCase()));
}

export const TAGGING_SYSTEM = `You tag faux botanical inventory for an emotional design engine.

For each item you are given an id, a product name, a colour name and hex, and its structural role.

Return ONLY a JSON array. One object per item, in the same order:
[{"id":"...","emotion_tags":["...","..."],"seasonality":["..."]}]

Rules:
- emotion_tags: 2-3 lowercase single words describing the FEELING the material carries (e.g. grounded, hushed, festive, nostalgic, lush, austere, tender). Not colours, not the plant name.
- seasonality: one or more of exactly "spring", "summer", "fall", "winter", "year-round". Use "year-round" only when the material genuinely reads in any season.
- Judge from the material itself. A frosted or snowy finish reads winter. Maple, oak and wheat read fall. Evergreens read year-round unless the finish says otherwise.
- No prose, no code fences, no explanation. The array only.`;

/**
 * The task sent to a Managed Agent.
 *
 * The agent brings its own judgment from its stored system prompt; this message
 * brings the output contract, because that prompt was written in the Console and
 * this app has never seen it. Asking for the shape here is what makes an agent
 * built for some other surface usable from this one.
 */
export function taggingRequest(list: InventorySpecies[], batch: number, batches: number): string {
  const header =
    batches > 1
      ? `Batch ${batch} of ${batches}. Tag these faux botanical inventory items.`
      : 'Tag these faux botanical inventory items.';

  return `${header}

Each line is: id | product name | colour name and hex | structural role | form factor

${describeForTagging(list)}

Reply with ONLY a JSON array — no prose, no code fences, no commentary:
[{"id":"<the id exactly as given>","emotion_tags":["...","..."],"seasonality":["..."]}]

- emotion_tags: 2-3 lowercase single words for the FEELING the material carries (grounded, hushed, festive, nostalgic, lush, austere, tender). Not colours, not the plant name.
- seasonality: one or more of exactly "spring", "summer", "fall", "winter", "year-round". Use "year-round" only when the material genuinely reads in any season.
- One object per item, every id accounted for, same order.`;
}

/** The compact item list handed to the model. */
export function describeForTagging(list: InventorySpecies[]): string {
  return list
    .map((s) => {
      const sku = s.skus[0];
      return `${s.canon_id} | ${s.species} | ${sku?.color_name ?? ''} ${sku?.hex ?? ''} | ${sku?.primary_role ?? ''} | ${s.form_factor ?? ''}`;
    })
    .join('\n');
}

export interface TagResult {
  id: string;
  emotion_tags?: string[];
  seasonality?: string[];
}

/** Write tags back onto the register, leaving anything the model skipped alone. */
export function applyTags(inv: Inventory, results: TagResult[]): Inventory {
  const byId = new Map(results.map((r) => [r.id, r]));
  return {
    ...inv,
    species: (inv.species ?? []).map((s) => {
      const r = byId.get(s.canon_id);
      if (!r) return s;
      const tags = (r.emotion_tags ?? []).map((t) => String(t).toLowerCase()).filter(Boolean);
      const seasons = (r.seasonality ?? [])
        .map((t) => String(t).toLowerCase())
        .filter((t) => CANON_SEASONS.has(t));
      return {
        ...s,
        emotion_tags: tags.length ? tags : s.emotion_tags,
        primary_emotion: (s.primary_emotion || tags[0] || '') as InventorySpecies['primary_emotion'],
        secondary_emotion: (s.secondary_emotion || tags[1] || '') as InventorySpecies['secondary_emotion'],
        seasonality: seasons.length ? seasons : s.seasonality,
      };
    }),
  };
}
