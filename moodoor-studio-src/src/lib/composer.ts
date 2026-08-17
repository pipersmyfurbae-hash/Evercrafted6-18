import type { Blueprint, BlueprintCluster, LibraryItem } from '../types/library';
import { FORM_LANGUAGE, PRODUCT_FORMS } from '../data/formLanguage';
import { SHOTS, SHOT_BY_KEY, type CameraShot, type ShotKey } from '../data/cameras';
import { cleanNegatives } from './prompts';
import { composeRing, gravityFromPoints, silenceArcsOf } from './placement';
import { describeSector, rangeCenter } from './geometry';

/** 0° is 12 o'clock, running clockwise — the convention the blueprints use. */
export function degToClock(deg: number): string {
  const d = ((deg % 360) + 360) % 360;
  const totalMins = (d / 360) * 720;
  const h = Math.floor(totalMins / 60) % 12 || 12;
  const m = (Math.round((totalMins % 60) / 5) * 5) % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

export type LanguageSections = Partial<
  Record<'ATMOSPHERE' | 'MATERIAL LANGUAGE' | 'EDITORIAL VOICE' | 'ANTI-PATTERNS', string>
>;

const SECTION_KEYS = ['ATMOSPHERE', 'MATERIAL LANGUAGE', 'EDITORIAL VOICE', 'ANTI-PATTERNS'] as const;

/** Split the AI language draft on its `[SECTION]` headers. */
export function parseSections(text: string): LanguageSections {
  const out: LanguageSections = {};
  SECTION_KEYS.forEach((key, i) => {
    const tag = `[${key}]`;
    const start = text.indexOf(tag);
    if (start === -1) return;
    const from = start + tag.length;
    const nextKey = SECTION_KEYS[i + 1];
    const next = nextKey ? text.indexOf(`[${nextKey}]`) : -1;
    out[key] = text.slice(from, next > -1 ? next : text.length).trim();
  });
  return out;
}

/**
 * Colors Midjourney reliably mutes when they're buried mid-prompt behind other
 * material tokens. Naming them again up front is what keeps a blue hydrangea blue.
 */
const COLOR_WORDS = [
  'blue',
  'navy',
  'burgundy',
  'crimson',
  'scarlet',
  'emerald',
  'violet',
  'plum',
  'gold',
  'copper',
  'rust',
  'blush',
  'coral',
];

/**
 * The colour to lock, read from the SKU colourway rather than the species name.
 *
 * A stem reads `"Blue Cedar — Rust"`: the species is named blue, the colourway
 * actually in stock is rust. Scanning the whole string locked the *species*
 * word and compiled "Blue Cedar — Rust (true saturated blue)" — a prompt
 * arguing with itself, which v7 resolves by picking one at random.
 */
function colorOf(name: string): string | undefined {
  const [species, colorway] = (name ?? '').toLowerCase().split(/\s+—\s+|\s+-\s+/, 2);
  const inColorway = colorway ? COLOR_WORDS.find((w) => colorway.includes(w)) : undefined;
  if (inColorway) return inColorway;
  // No colour word in the colourway — fall back to the species name only when
  // the colourway has nothing of its own to contradict it.
  return colorway ? undefined : COLOR_WORDS.find((w) => (species ?? '').includes(w));
}

/** Read the form code off a blueprint, tolerating the common key spellings. */
function formCodeOf(bp: Blueprint): string | undefined {
  return bp.form_code || bp.formCode || bp.product_form_code || undefined;
}

const BASE_NEGATIVES = [
  'fresh flowers',
  'dew',
  'wilting',
  'plastic shine',
  'craft store',
  'fake farmhouse',
  'muted colors',
  'sepia',
  'faded',
  'desaturated',
  'symmetry',
  'text',
  'frame',
  'blur',
];

const clustersOfType = (clusters: BlueprintCluster[], ...types: string[]) =>
  clusters.filter((c) => types.includes(c.type ?? ''));

const stemsOf = (arr: BlueprintCluster[]) => arr.flatMap((c) => c.stems ?? []);

/**
 * The machine-facing prompt: one literal MJ-ready string ordered by token
 * priority — subject, then materials by dominance, composition, lighting,
 * background, camera, params. "Photorealistic" is deliberately absent; camera
 * and lens references read as more real to v7 than the word itself does.
 *
 * Only the trailing camera bundle and `--ar` change between angles — everything
 * naming the piece is identical, so a set reads as one wreath, six photographs.
 */
export function buildMachinePrompt(bp: Blueprint, shot: CameraShot = SHOTS[0]): string {
  const formula = bp.formula || 'Custom';
  const size = bp.canvas?.diameter_in ? `${bp.canvas.diameter_in}"` : '24"';
  const sil = (bp.silence_arcs ?? [])[0];
  const clusters = bp.clusters ?? [];

  const matClause = (arr: BlueprintCluster[]) =>
    stemsOf(arr)
      .map((st) => {
        const nm = st.name || st.item_id || '';
        const col = colorOf(nm);
        return col ? `${nm} (true saturated ${col})` : nm;
      })
      .join(', ');

  const focalStr = matClause(clustersOfType(clusters, 'focal'));
  const secondaryStr = matClause(clustersOfType(clusters, 'secondary'));
  const fillStr = matClause(clustersOfType(clusters, 'filler', 'accent'));

  // v7 dropped `::` weighting, so dominance is carried by word order — the focal
  // is named first, immediately after the subject, and labelled as dominant.
  const matParts = [
    focalStr && `${focalStr} as the single dominant focal cluster`,
    secondaryStr && `${secondaryStr} as secondary support`,
    fillStr && `${fillStr} as minor accents`,
  ].filter(Boolean);

  const foliageNames = (bp.foliage_sweeps ?? []).map((f) => f.name || f.item_id).filter(Boolean);

  const code = formCodeOf(bp);
  const fl = code ? FORM_LANGUAGE[code] : undefined;
  const noun = fl?.noun ?? 'wreath';
  const baseDesc = fl?.base ?? 'natural grapevine base';
  const mountDesc = fl?.mount ?? 'wall-mounted, entire wreath visible in frame';

  // The clock-position silence arc is ring geometry — it only applies when no
  // form code has claimed a different shape.
  const silStr =
    sil && !shot.dropNegativeSpace
      ? `, ${degToClock(sil.from_deg)}–${degToClock(sil.to_deg)} o'clock left bare — raw exposed grapevine only, zero botanicals`
      : '';
  // Where the mass actually sits, measured off the cluster angles. Ring
  // geometry only — a coded form is not a circle and has no 4 o'clock.
  const gravity = fl
    ? null
    : gravityFromPoints(
        clusters.map((c) => ({
          deg: c.angle_deg ?? 0,
          weight: (c.stems ?? []).reduce((sum, st) => sum + (st.qty || 1), 0),
        })),
      );
  const gravityStr =
    gravity && gravity.concentration >= 0.12
      ? `, visual weight gathered toward the ${describeSector(gravity.deg)}`
      : '';
  const asym = `${formula.toLowerCase()} asymmetric composition, organic arrangement, dynamic balance${gravityStr}${fl ? '' : silStr}`;

  // Season, palette and mood. None of these reached the machine prompt before —
  // `bp.emotional_tags` was carried on the blueprint and never read, so a
  // Christmas brief and a harvest brief compiled to the same sentence.
  const seasonStr = bp.season ? `${bp.season} seasonal register` : '';
  const paletteStr = (bp.palette ?? []).length
    ? `palette of ${(bp.palette ?? []).slice(0, 4).join(', ')}`
    : '';
  const moodStr = (bp.emotional_tags ?? []).slice(0, 4).join(', ');

  const subject = `Product photography of a ${size} luxury faux botanical ${noun} on a ${baseDesc}`;
  const materials = matParts.length
    ? `made of ${matParts.join(', ')}, plus ${foliageNames.join(' and ') || 'preserved foliage'} sweeps`
    : `made of ${foliageNames.join(' and ') || 'preserved botanicals'}`;
  const lighting =
    'softbox studio lighting, soft diffused, primary from upper-left, gentle shadow falloff';
  const background = `${shot.setting ?? fl?.setting ?? 'cool gray plaster wall'}, ${shot.mount ?? mountDesc}`;
  const styleWords = 'luxury editorial style, high-end retouching, commercial color grading';

  const negatives = cleanNegatives(
    [...BASE_NEGATIVES, ...(shot.extraNegatives ?? [])],
    stemsOf(clusters).map((st) => ({ species: st.name ?? st.item_id ?? '', color_name: '' })),
    { ribbon: '' },
  );

  return [
    `${subject} ${materials}`,
    seasonStr,
    paletteStr,
    moodStr,
    asym,
    lighting,
    background,
    shot.camera,
    styleWords,
  ]
    .filter(Boolean)
    .join(', ')
    .concat(` --ar ${shot.ar} --style raw --s 100 --v 7 --no ${negatives.join(', ')}`);
}

/** The full six-angle set for a blueprint. */
export function buildMachineShotSet(bp: Blueprint): Record<ShotKey, string> {
  return Object.fromEntries(SHOTS.map((s) => [s.key, buildMachinePrompt(bp, s)])) as Record<
    ShotKey,
    string
  >;
}

/** The paste-ready prose version, carrying the AI language layers verbatim. */
export function buildHumanPrompt(bp: Blueprint, s: LanguageSections): string {
  const formula = bp.formula || 'Custom';
  const size = bp.canvas?.diameter_in ? `${bp.canvas.diameter_in}-inch` : '24-inch';

  const code = formCodeOf(bp);
  const fl = code ? FORM_LANGUAGE[code] : undefined;
  const noun = fl?.noun ?? 'wreath';
  const baseDesc = fl?.base ?? 'natural grapevine base';
  const mountDesc = fl?.mount ?? 'wall-mounted perspective';

  const sil = (bp.silence_arcs ?? [])[0];
  const silStr =
    sil && !fl
      ? `From ${degToClock(sil.from_deg)} to ${degToClock(sil.to_deg)} o'clock, a hard-enforced bare zone exposes the raw dark grapevine in full — no botanicals, no foliage, no filler; a designed architectural feature equal in compositional weight to the botanical mass itself.`
      : '';

  const clDesc = (bp.clusters ?? [])
    .map((c) => {
      const stems = (c.stems ?? []).map((st) => `${st.name || st.item_id} ×${st.qty}`).join(', ');
      return `${stems} at ${c.angle_deg != null ? degToClock(c.angle_deg) : '—'} o'clock`;
    })
    .join('; ');

  const folDesc = (bp.foliage_sweeps ?? [])
    .map((f) => {
      const stop = f.arc_hard_stop_deg ?? f.arc_to;
      return `${f.name || f.item_id} (${f.arc_from != null ? degToClock(f.arc_from) : '—'} to ${stop != null ? degToClock(stop) : '—'})`;
    })
    .join(' and ');

  // Front-load every named color so v7 can't drift it toward the warm palette
  // the rest of the prompt implies.
  const found = new Set<string>();
  for (const c of bp.clusters ?? []) {
    for (const st of c.stems ?? []) {
      const w = colorOf(st.name ?? '');
      if (w) found.add(w);
    }
  }
  const colorLock = [...found];
  const colorLockLine = colorLock.length
    ? `The ${colorLock.join(' and ')} tones are rendered true and saturated — vividly, unmistakably ${colorLock.join('/')} throughout, never muted, faded, sepia-toned, or drifting toward neutral warm tones.`
    : '';

  const lines = [
    `Product photography — ${SHOT_BY_KEY.hero.camera} — of a ${size} luxury faux botanical ${noun} on a ${baseDesc}, ${formula.toLowerCase()} composition. ${s['EDITORIAL VOICE'] ?? ''}`.trim(),
    '',
    [bp.season && `${bp.season} seasonal register.`, (bp.palette ?? []).length && `Palette: ${(bp.palette ?? []).join(', ')}.`, (bp.emotional_tags ?? []).length && `Emotional register: ${(bp.emotional_tags ?? []).join(', ')}.`]
      .filter(Boolean)
      .join(' '),
    '',
    colorLockLine,
    '',
    s['ATMOSPHERE'] ?? '',
    '',
    `Botanical arrangement: ${clDesc}. Foliage: ${folDesc}. ${silStr}`.trim(),
    '',
    s['MATERIAL LANGUAGE'] ?? '',
    '',
    `Softbox studio lighting, soft diffused, primary from upper-left; gentle directional shadow falloff; ${fl?.setting ?? 'cool gray plaster background'}; ${mountDesc}, slight editorial angle (5–10°). True-to-life scale accuracy. Luxury editorial style, high-end retouching, commercial color grading — not creative art, not illustration, not romanticized.`,
    '',
    s['ANTI-PATTERNS'] ?? '',
    '',
    `--ar ${SHOT_BY_KEY.hero.ar} --style raw --s 100 --v 7`,
  ];

  return lines.filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n');
}

/**
 * Synthesize an EC_WR_V2 blueprint from a LibraryItem's materials, so a recipe
 * generated upstream can be composed without hand-writing JSON.
 */
export function blueprintFromLibraryItem(item: LibraryItem): Blueprint {
  // Angles and rest come from `composeRing`, which lays the materials out and
  // then *measures* the gaps. Before this, every generated blueprint claimed
  // evenly-spaced clusters and the same 82°–168° silence arc no matter what was
  // in it — geometry no one had composed, in every prompt downstream.
  const composition = composeRing(item);

  const clusters: BlueprintCluster[] = composition.placements.map((p, i) => ({
    cluster_id: `C${i + 1}`,
    type: p.material.primary_role || 'accent',
    angle_deg: Math.round(rangeCenter(p.range)),
    stems: [{ name: `${p.material.species} — ${p.material.color_name}`, qty: p.material.qty || 1 }],
  }));

  const seed =
    (Math.abs([...(item.id ?? '')].reduce((a, c) => a + c.charCodeAt(0), 0)) % 9000) + 100;

  return {
    blueprint_id: `EC_WR_V2_${item.id}`,
    formula: composition.formula,
    seed,
    emotional_tags: item.emotional_tags ?? [],
    season: item.season,
    palette: item.palette,
    canvas: { diameter_in: 24 },
    silence_arcs: silenceArcsOf(composition),
    clusters,
    foliage_sweeps: [],
  };
}

/** The structural summary handed to the Render Language Engine. */
export function describeBlueprintForAi(bp: Blueprint): string {
  const formula = bp.formula || '—';
  const size = bp.canvas?.diameter_in ? `${bp.canvas.diameter_in}"` : '—';
  const tags = (bp.emotional_tags ?? []).join(', ');
  const sil = (bp.silence_arcs ?? [])[0];
  const silence = sil ? `${sil.from_deg}°–${sil.to_deg}°` : 'None';

  const clusters = (bp.clusters ?? [])
    .map(
      (c) =>
        `${c.type} at ${c.angle_deg}°: ${(c.stems ?? []).map((st) => `${st.name || st.item_id} ×${st.qty}`).join(', ')}`,
    )
    .join('\n  ');

  const foliage = (bp.foliage_sweeps ?? [])
    .map((f) => `${f.name || f.item_id}: ${f.arc_from}°–${f.arc_hard_stop_deg ?? f.arc_to}°`)
    .join(' | ');

  return `Formula: ${formula}\nSize: ${size}\nEmotional Tags: ${tags}\nSilence Arc: ${silence}\nClusters:\n  ${clusters}\nFoliage: ${foliage}`;
}

/** The form-code options offered by the Composer's Product form dropdown. */
export function formCodeOptions(): { code: string; label: string }[] {
  return [
    { code: '', label: 'Wreath (default — no form_code)' },
    ...Object.entries(PRODUCT_FORMS).map(([code, spec]) => ({
      code,
      label: `${code} — ${spec.name}`,
    })),
  ];
}
