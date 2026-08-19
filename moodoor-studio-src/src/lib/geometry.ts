/**
 * Polar arc algebra.
 *
 * Ported from the Evercrafted Placement Engine's `core/geometry.js`, typed and
 * trimmed to the functions Moodoor needs (the SVG path builders stayed behind —
 * nothing here draws).
 *
 * ANGLE CONVENTION, unchanged from the source so the two stay interchangeable:
 *   - Degrees, measured CLOCKWISE from 12 o'clock.
 *   - 12 o'clock = 0°, 3 o'clock = 90°, 6 o'clock = 180°, 9 o'clock = 270°.
 *   - Degrees are the ONLY stored unit. Clock notation is a display format.
 *
 * A range is `{ start, span }`: begins at `start` and extends `span` degrees
 * clockwise. `span` is always in [0, 360].
 *
 * Pure — no DOM, no state, directly testable.
 */

export interface ArcRange {
  start: number;
  span: number;
}

export const DEG_PER_HOUR = 30;
const EPS = 1e-9;

/** Normalise any angle into [0, 360). */
export function normDeg(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

/** Smallest signed rotation from `a` to `b`, in (-180, 180]. */
export function signedDelta(a: number, b: number): number {
  let d = normDeg(b) - normDeg(a);
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/** Clock hour (may be fractional, e.g. 7.5) → degrees clockwise from 12. */
export function clockToDeg(hour: number): number {
  return normDeg(hour * DEG_PER_HOUR);
}

export function clampSpan(span: number): number {
  if (!Number.isFinite(span) || span <= 0) return 0;
  return Math.min(span, 360);
}

/** End angle of a range. */
export function rangeEnd(range: ArcRange): number {
  return normDeg(range.start + range.span);
}

/** Build a range from a centre angle and a total width. */
export function rangeFromCenter(centerDeg: number, spanDeg: number): ArcRange {
  const span = clampSpan(spanDeg);
  return { start: normDeg(centerDeg - span / 2), span };
}

/** Centre angle of a range. */
export function rangeCenter(range: ArcRange): number {
  return normDeg(range.start + range.span / 2);
}

/** Is `deg` inside `range` (inclusive of both edges)? */
export function angleInRange(deg: number, range: ArcRange): boolean {
  if (range.span >= 360) return true;
  if (range.span <= 0) return false;
  return normDeg(deg - range.start) <= range.span + EPS;
}

/** Degrees of overlap between two ranges. */
export function rangeOverlap(a: ArcRange, b: ArcRange): number {
  if (a.span <= 0 || b.span <= 0) return 0;
  if (a.span >= 360) return b.span;
  if (b.span >= 360) return a.span;

  // Work in a frame where a.start = 0; b then occupies [rel, rel + b.span],
  // and its wrapped copy [rel - 360, rel + b.span - 360].
  const rel = normDeg(b.start - a.start);
  let total = 0;
  for (const bStart of [rel, rel - 360]) {
    const lo = Math.max(0, bStart);
    const hi = Math.min(a.span, bStart + b.span);
    if (hi > lo) total += hi - lo;
  }
  return total;
}

/** Subtract `hole` from `range`, returning 0, 1 or 2 surviving ranges. */
export function subtractArc(range: ArcRange, hole: ArcRange): ArcRange[] {
  if (!range || range.span <= 0) return [];
  if (!hole || hole.span <= 0) return [{ ...range }];
  if (hole.span >= 360) return [];

  const rel = normDeg(hole.start - range.start);
  // Both the hole and its wrapped copy can bite into [0, range.span].
  const cuts: [number, number][] = [
    [rel, rel + hole.span],
    [rel - 360, rel + hole.span - 360],
  ];

  let segments: [number, number][] = [[0, range.span]];
  for (const [holeLo, holeHi] of cuts) {
    const next: [number, number][] = [];
    for (const [lo, hi] of segments) {
      if (holeHi <= lo + EPS || holeLo >= hi - EPS) {
        next.push([lo, hi]);
        continue;
      }
      if (holeLo > lo + EPS) next.push([lo, Math.min(holeLo, hi)]);
      if (holeHi < hi - EPS) next.push([Math.max(holeHi, lo), hi]);
    }
    segments = next;
  }

  return segments
    .filter(([lo, hi]) => hi - lo > EPS)
    .map(([lo, hi]) => ({ start: normDeg(range.start + lo), span: hi - lo }));
}

/** Subtract several holes in turn. */
export function subtractArcs(range: ArcRange, holes: ArcRange[]): ArcRange[] {
  let result: ArcRange[] = [{ ...range }];
  for (const hole of holes) result = result.flatMap((seg) => subtractArc(seg, hole));
  return result;
}

/** Merge overlapping/adjacent ranges into a minimal covering set. */
export function mergeRanges(ranges: ArcRange[]): ArcRange[] {
  const live = ranges.filter((r) => r && r.span > EPS);
  if (!live.length) return [];
  if (live.some((r) => r.span >= 360 - EPS)) return [{ start: 0, span: 360 }];

  // Split every range at the 0/360 seam so plain interval merging works.
  const flat: [number, number][] = [];
  for (const r of live) {
    const start = normDeg(r.start);
    const end = start + r.span;
    if (end <= 360 + EPS) {
      flat.push([start, Math.min(end, 360)]);
    } else {
      flat.push([start, 360]);
      flat.push([0, end - 360]);
    }
  }
  flat.sort((a, b) => a[0] - b[0]);

  const merged: [number, number][] = [];
  for (const [lo, hi] of flat) {
    const last = merged[merged.length - 1];
    if (last && lo <= last[1] + EPS) last[1] = Math.max(last[1], hi);
    else merged.push([lo, hi]);
  }

  // Re-join across the seam if the set wraps.
  if (merged.length > 1 && merged[0][0] <= EPS && merged[merged.length - 1][1] >= 360 - EPS) {
    const first = merged.shift()!;
    merged[merged.length - 1][1] += first[1];
  }

  if (merged.length === 1 && merged[0][1] - merged[0][0] >= 360 - EPS) {
    return [{ start: 0, span: 360 }];
  }
  return merged.map(([lo, hi]) => ({ start: normDeg(lo), span: hi - lo }));
}

/** The complement of a set of ranges on the full circle. */
export function complementRanges(ranges: ArcRange[]): ArcRange[] {
  const covered = mergeRanges(ranges);
  if (!covered.length) return [{ start: 0, span: 360 }];
  if (covered.length === 1 && covered[0].span >= 360 - EPS) return [];

  const gaps: ArcRange[] = [];
  for (let i = 0; i < covered.length; i += 1) {
    const current = covered[i];
    const next = covered[(i + 1) % covered.length];
    const gapStart = rangeEnd(current);
    const gapSpan = normDeg(next.start - gapStart);
    if (gapSpan > EPS) gaps.push({ start: gapStart, span: gapSpan });
  }
  return gaps;
}

/** Unit-circle projection using the clock convention above. */
export function polarUnit(deg: number): { x: number; y: number } {
  const t = (normDeg(deg) * Math.PI) / 180;
  return { x: Math.sin(t), y: -Math.cos(t) };
}

/** Angle of a vector, back in clock-convention degrees. */
export function angleOfVector(x: number, y: number): number {
  return normDeg((Math.atan2(x, -y) * 180) / Math.PI);
}

/**
 * Plain-language sector name for an angle. Midjourney has no idea what 168°
 * means; it understands "lower right".
 */
export function describeSector(deg: number): string {
  const d = normDeg(deg);
  if (d >= 337.5 || d < 22.5) return 'top';
  if (d < 67.5) return 'upper right';
  if (d < 112.5) return 'right';
  if (d < 157.5) return 'lower right';
  if (d < 202.5) return 'bottom';
  if (d < 247.5) return 'lower left';
  if (d < 292.5) return 'left';
  return 'upper left';
}
