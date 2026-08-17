import type { LibraryItem, Material } from '../types/library';
import {
  complementRanges,
  describeSector,
  normDeg,
  polarUnit,
  angleOfVector,
  rangeCenter,
  rangeFromCenter,
  type ArcRange,
} from './geometry';
import { roleOf } from './prompts';

/**
 * Where the material actually sits on the ring.
 *
 * Before this existed, `blueprintFromLibraryItem` spaced every cluster evenly
 * around the circle and declared the same silence arc (82°–168°) for every
 * design ever generated. Every render prompt therefore described geometry that
 * nobody had composed, and the two verification camera angles had nothing true
 * to verify against.
 *
 * The arc algebra is ported from the Evercrafted Placement Engine
 * (`core/geometry.js`, `core/analysis.js`). Rest zones are now *measured* —
 * `complementRanges` of what was placed — rather than asserted.
 *
 * SCOPE: this is ring geometry. It applies to wreaths, which carry no
 * `form_code`. A mantel garland or a staircase cascade is not a circle, so
 * coded forms keep their own per-form spatial language in `formLanguage.ts`
 * rather than being forced through a polar model that does not describe them.
 */

/**
 * UNCALIBRATED PLACEMENT DEFAULTS.
 *
 * Following the Placement Engine's discipline: every number here is an
 * engineering default chosen to produce a plausible crescent, not a calibrated
 * design law. Nothing downstream may state a conclusion drawn from these as
 * fact. When real calibration exists, these are replaced, not nudged.
 */
export const PLACEMENT_DEFAULTS = {
  /**
   * How much ring one unit of presence covers. More material covers more of the
   * circle and leaves less rest, so the worked fraction is derived per recipe
   * rather than fixed — a fixed one would make the derived formula name a
   * constant dressed up as a measurement.
   */
  baseWorkedFraction: 0.3,
  workedPerPresence: 0.028,
  minWorkedFraction: 0.35,
  maxWorkedFraction: 0.88,
  /** Relative visual presence per role, used for both span and gravity. */
  roleWeight: { focal: 1, secondary: 0.6, accent: 0.35 } as Record<string, number>,
  /** Minimum span any single material gets, so an accent never vanishes. */
  minSpanDeg: 8,
} as const;

export interface Placement {
  material: Material;
  range: ArcRange;
  presence: number;
}

export interface CompositionGravity {
  /** Direction the summed visual weight points, in clock-convention degrees. */
  deg: number;
  /** 0 = evenly distributed around the ring, 1 = all mass at one angle. */
  concentration: number;
  total: number;
}

export interface RingComposition {
  placements: Placement[];
  /** Measured, not asserted: the gaps left by what was placed. */
  restZones: ArcRange[];
  gravity: CompositionGravity;
  /** Named from the resulting geometry rather than assumed. */
  formula: string;
}

/** Visual presence of one material — quantity scaled by its role. */
export function presenceOf(m: Material): number {
  const weight = PLACEMENT_DEFAULTS.roleWeight[roleOf(m)] ?? 0.5;
  return Math.max(1, m.qty || 1) * weight;
}

/** How much of the ring this much material covers. */
export function workedFraction(totalPresence: number): number {
  const d = PLACEMENT_DEFAULTS;
  const raw = d.baseWorkedFraction + totalPresence * d.workedPerPresence;
  return Math.min(d.maxWorkedFraction, Math.max(d.minWorkedFraction, raw));
}

/** Deterministic rotation per item, so re-opening a recipe never moves it. */
function seedRotation(id: string): number {
  let h = 0;
  const str = String(id || 'moodoor');
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

/**
 * Lay the materials out as a crescent: one contiguous worked arc with the focal
 * mass at its heart, secondaries flanking it and accents running out to the
 * tails, leaving the remainder of the ring bare.
 */
export function composeRing(item: LibraryItem, override?: Material[]): RingComposition {
  // The caller may pass the *resolved* floral set, so the geometry describes the
  // same stems the prompt names rather than the raw record.
  const mats = (override ?? item.materials ?? []).filter((m) => (m.qty || 1) > 0);
  if (!mats.length) {
    return {
      placements: [],
      restZones: [{ start: 0, span: 360 }],
      gravity: { deg: 0, concentration: 0, total: 0 },
      formula: 'Unresolved',
    };
  }

  // Focal at the centre of the worked arc, then alternating outward — the
  // ordering is what makes it read as a crescent rather than a stripe.
  const byWeight = [...mats].sort((a, b) => presenceOf(b) - presenceOf(a));
  const ordered: Material[] = [];
  byWeight.forEach((m, i) => (i % 2 === 0 ? ordered.push(m) : ordered.unshift(m)));

  const presences = ordered.map(presenceOf);
  const totalPresence = presences.reduce((a, b) => a + b, 0);
  const workedSpan = 360 * workedFraction(totalPresence);
  const workedStart = seedRotation(item.id);

  let cursor = workedStart;
  const placements: Placement[] = ordered.map((material, i) => {
    const span = Math.max(
      PLACEMENT_DEFAULTS.minSpanDeg,
      (presences[i] / totalPresence) * workedSpan,
    );
    const range: ArcRange = { start: normDeg(cursor), span };
    cursor = normDeg(cursor + span);
    return { material, range, presence: presences[i] };
  });

  const restZones = complementRanges(placements.map((p) => p.range));

  // Summed unit vectors weighted by presence — the Placement Engine's
  // compositionGravity, over materials instead of pocket objects.
  let vx = 0;
  let vy = 0;
  for (const p of placements) {
    const u = polarUnit(rangeCenter(p.range));
    vx += u.x * p.presence;
    vy += u.y * p.presence;
  }
  const magnitude = Math.hypot(vx, vy);
  const gravity: CompositionGravity = {
    deg: magnitude > 1e-9 ? angleOfVector(vx, vy) : 0,
    concentration: totalPresence > 0 ? magnitude / totalPresence : 0,
    total: totalPresence,
  };

  return { placements, restZones, gravity, formula: nameFormula(restZones) };
}

/**
 * Name the shape from the rest it leaves. Descriptive, not prescriptive — it
 * reports what the arcs came out as instead of asserting a formula up front.
 */
// `Split Cluster` and `Full Ring` are reachable for arbitrary input; the
// current composer lays one contiguous arc, so in practice it names crescents
// and horseshoes. The function stays general rather than encoding that habit.
export function nameFormula(restZones: ArcRange[]): string {
  const significant = restZones.filter((r) => r.span >= 20);
  if (!significant.length) return 'Full Ring';
  const largest = significant.reduce((a, b) => (b.span > a.span ? b : a));
  if (significant.length >= 2) return 'Split Cluster';
  if (largest.span >= 150) return 'Crescent';
  if (largest.span >= 90) return 'Asymmetric Crescent';
  return 'Horseshoe';
}

/**
 * Coarse reading of where the weight sits. Deliberately four values — a 2-D
 * vector cannot honestly distinguish more than that, and inventing finer
 * gradations would manufacture precision the measurement does not have.
 */
export function readGravityDirection(g: CompositionGravity): string {
  if (g.concentration < 0.12) return 'evenly distributed';
  const d = normDeg(g.deg);
  if (d >= 315 || d < 45) return 'lifted';
  if (d >= 135 && d < 225) return 'grounded';
  return 'lateral';
}

/**
 * The measured geometry as Midjourney direction. v7 does not understand "168°";
 * it understands "lower right" and "left bare".
 */
export function describeComposition(c: RingComposition): string {
  if (!c.placements.length) return '';
  const parts = [
    `visual weight gathered toward the ${describeSector(c.gravity.deg)}`,
  ];
  const rest = c.restZones.filter((r) => r.span >= 25);
  if (rest.length) {
    const arcs = rest
      .map((r) => `the ${describeSector(rangeCenter(r))}`)
      .join(' and ');
    parts.push(`leaving ${arcs} bare — exposed grapevine, an intentional pause not a gap`);
  }
  return parts.join(', ');
}

/**
 * Gravity from bare angle/weight pairs, for callers holding a blueprint's
 * clusters rather than a material list.
 */
export function gravityFromPoints(points: { deg: number; weight: number }[]): CompositionGravity {
  let vx = 0;
  let vy = 0;
  let total = 0;
  for (const p of points) {
    const w = Math.max(0, p.weight);
    if (!w) continue;
    const u = polarUnit(p.deg);
    vx += u.x * w;
    vy += u.y * w;
    total += w;
  }
  const magnitude = Math.hypot(vx, vy);
  return {
    deg: magnitude > 1e-9 ? angleOfVector(vx, vy) : 0,
    concentration: total > 0 ? magnitude / total : 0,
    total,
  };
}

/** Silence arcs in the EC_WR_V2 `{from_deg, to_deg}` shape. */
export function silenceArcsOf(c: RingComposition): { from_deg: number; to_deg: number }[] {
  return c.restZones
    .filter((r) => r.span >= 20)
    .map((r) => ({ from_deg: Math.round(r.start), to_deg: Math.round(normDeg(r.start + r.span)) }));
}

export { rangeFromCenter };
