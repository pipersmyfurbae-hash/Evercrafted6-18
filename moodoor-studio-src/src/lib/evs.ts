import type { Emotion, Inventory } from '../types/inventory';
import { EVS_AXES, type EvsAxis, type EvsVector, type Material } from '../types/library';

/**
 * How each species emotion pushes on the seven EVS axes. Melancholy is the only
 * entry that pulls an axis down — everything else accumulates.
 */
const EMOTION_AXES: Record<Emotion, Partial<Record<EvsAxis, number>>> = {
  comfort: { warmth: 0.8, restraint: 0.5, intimacy: 0.6 },
  joy: { valence: 0.8, energy: 0.5 },
  nostalgia: { nostalgia: 0.9, seasonal: 0.5 },
  renewal: { energy: 0.6, valence: 0.6, seasonal: 0.4 },
  connection: { intimacy: 0.8, warmth: 0.5 },
  reverence: { restraint: 0.8, intimacy: 0.5 },
  celebration: { valence: 0.8, energy: 0.7 },
  melancholy: { restraint: 0.7, valence: -0.4, nostalgia: 0.5 },
  tenderness: { intimacy: 0.7, warmth: 0.5 },
  wonder: { energy: 0.5, valence: 0.5, restraint: 0.3 },
};

/** Neutral-ish start point, so a sparse recipe still lands mid-register. */
const BASELINE: EvsVector = {
  warmth: 0.4,
  energy: 0.4,
  nostalgia: 0.4,
  valence: 0.5,
  intimacy: 0.4,
  restraint: 0.4,
  seasonal: 0.4,
};

const clamp = (x: number) => Math.max(0.02, Math.min(0.98, x));
const round3 = (x: number) => Math.round(x * 1000) / 1000;

/**
 * Project a recipe onto the 7-axis EVS grid. Each material contributes in
 * proportion to its quantity share; a species' primary emotion carries 65% of
 * that weight and its secondary the remaining 35%.
 */
export function predictedEvsFromMaterials(materials: Material[], inv: Inventory): EvsVector {
  const bySpecies = new Map(inv.species.map((s) => [s.species, s]));
  const acc: EvsVector = { ...BASELINE };
  const totalQty = materials.reduce((a, m) => a + (m.qty || 1), 0) || 1;

  for (const m of materials) {
    const species = bySpecies.get(m.species);
    if (!species) continue;
    const share = (m.qty || 1) / totalQty;

    [species.primary_emotion, species.secondary_emotion].forEach((emotion, i) => {
      const axes = EMOTION_AXES[emotion];
      if (!axes) return;
      const weight = i === 0 ? 0.65 : 0.35;
      for (const [axis, push] of Object.entries(axes) as [EvsAxis, number][]) {
        acc[axis] = clamp(acc[axis] + push * weight * share * 0.6);
      }
    });
  }

  const out = {} as EvsVector;
  for (const axis of EVS_AXES) out[axis] = round3(acc[axis]);
  return out;
}

/** The emotional register a recipe reads as — primary emotions plus wheel sectors. */
export function emotionalTagsFromMaterials(materials: Material[], inv: Inventory): string[] {
  const bySpecies = new Map(inv.species.map((s) => [s.species, s]));
  const tags = new Set<string>();
  for (const m of materials) {
    const species = bySpecies.get(m.species);
    if (!species) continue;
    tags.add(species.primary_emotion);
    tags.add(species.wheel_sector);
  }
  return [...tags].slice(0, 6);
}

/**
 * Recipe drift: any axis where what the render actually reads as diverges from
 * what the recipe predicted by more than 0.15. Advisory, never blocking.
 */
export function driftCheck(
  predicted?: EvsVector,
  observed?: EvsVector,
): { drift: boolean; axes: EvsAxis[] } {
  if (!predicted || !observed) return { drift: false, axes: [] };
  const axes = EVS_AXES.filter((k) => Math.abs((predicted[k] ?? 0) - (observed[k] ?? 0)) > 0.15);
  return { drift: axes.length > 0, axes: [...axes] };
}
