import type { PromptEntry } from '../../types/library';

/** Filter vocabularies for the library rail. */
export const FORMULAS = [
  'All',
  'Crescent',
  'Side Sweep',
  'Bottom Heavy',
  'Diagonal Flow',
  'Twin Cluster',
  'Corner Cluster',
  'Wild Asymmetry',
  'Half Ring',
  'Top Cluster',
  'Spiral Flow',
  'Classic Balanced',
  'Garden Scatter',
];

export const SEASONS = ['All', 'Spring', 'Summer', 'Autumn', 'Winter'];

export const TAGS = [
  'airy',
  'calm',
  'fresh',
  'moody',
  'romantic',
  'editorial',
  'architectural',
  'lush',
  'restrained',
  'wild',
  'nostalgic',
  'melancholic',
];

const MACHINE_4217 = `[LAYER 1 — EMOTIONAL CORE]
  Atmosphere:         Airy spring restraint — quiet, unhurried, emotionally cool
  Tension Type:       Still expansion — the breath held just before something blooms
  Season Register:    Early spring morning — cool ambient light, no heat
  Mood Law:           Serene and meditative; never busy, cluttered, or lush-maximalist

[LAYER 2 — STYLE DNA]
  Identity:           Luxury faux botanical wreath, 24" Crescent composition
  Asymmetry:          Controlled irregularity — crescent arc refuses all symmetry
  Editorial Pressure: HIGH — Anthropologie window, interior design editorial
  Forbidden:          No craft-store aesthetic, no fake farmhouse styling,
                      no artificial plastic shine, no DIY faux florals

[LAYER 3 — STRUCTURAL BLUEPRINT LOGIC]
  Form:               Crescent — 24" polar canvas, seed 42
  Silence Arc:        HARD ENFORCED 82°–168° (2:45–5:30 o'clock)
                      Raw exposed grapevine only. Zero botanicals. Zero foliage.
  Focal C1:           Blue Hydrangea ×1 at 10:10 (305°), r0.78
  Secondary C2:       White Ranunculus ×3 at 11:05 (332°), r0.80

[LAYER 4 — MATERIAL INTELLIGENCE]
  Substrate:          Natural grapevine — dark twisted vine, visible in silence arc
  Dominant:           Blue silk hydrangea — mophead layered florets, cool matte surface

[LAYER 5 — SPATIAL DEPTH]
  Foreground:         Blue Hydrangea
  Midground:          White Ranunculus
  Background:         Sage + Eucalyptus sweeps, substrate in silence arc

[LAYER 6 — LIGHTING + PHOTOGRAPHY]
  Surface:            Cool gray plaster — smooth, neutral, slight texture
  Angle:              Wall-mounted, slight downward editorial angle (5–10°)

[LAYER 7 — ANTI-PATTERN SUPPRESSION]
  Blocked:            No bouquet arrangement, no central stem collision,
                      no symmetrical bloom mirroring, no botanicals in silence zone

[PARAMS]              --ar 5:4 --style raw --s 150 --v 7`;

const HUMAN_4217 = `Photorealistic professional product photograph of a 24-inch luxury faux botanical wreath on a natural grapevine base — crescent composition of airy spring restraint, designed with quiet editorial calm, never lush or maximalist.

From 2:45 o'clock to 5:30 o'clock, a hard-enforced bare zone reveals the raw dark twisted grapevine in full — no botanicals, no foliage, no filler; a designed architectural feature equal in compositional value to the botanical mass itself.

Botanical arrangement: Blue Hydrangea ×1 at 10:10 o'clock; White Ranunculus ×3 at 11:05 o'clock. Foliage: Sage (6:15 to 12:20) and Eucalyptus (7:10 to 11:50).

All materials high-end faux silk, indistinguishable from real blooms — soft matte petals, complete absence of plastic sheen, structured petal memory.

Soft diffused cool-neutral studio illumination from upper-left; gentle directional shadow; cool gray plaster background; wall-mounted perspective, slight editorial angle (5–10°). Entire wreath visible in frame. True-to-life scale accuracy. Gallery-quality product documentation — not creative art, not illustration, not romanticized.

No bouquet arrangement, no central stem collision, no symmetrical mirroring, no botanicals in bare zone, no foliage past 12:20, no perfect circular perimeter, no craft-store fullness, no fresh flowers.

--ar 5:4 --style raw --s 150 --v 7`;

/**
 * A worked example so the library is never empty on first visit — the Spring
 * Crescent, showing the full 7-layer machine breakdown alongside its
 * paste-ready prose counterpart.
 */
export const SEED: PromptEntry[] = [
  {
    id: 'EC_WR_V2_4217',
    title: 'Spring Crescent',
    subtitle: 'Airy · Calm · Fresh',
    formula: 'Crescent',
    season: 'Spring',
    size: '24"',
    seed: 42,
    emotionalTags: ['airy', 'calm', 'fresh'],
    substrate: 'Natural Grapevine',
    florals: ['Blue Hydrangea', 'White Ranunculus', 'Ivory Lisianthus', 'White Waxflower'],
    foliage: ['Sage', 'Eucalyptus'],
    silenceArc: '82°–168°',
    machinePrompt: MACHINE_4217,
    humanPrompt: HUMAN_4217,
    params: '--ar 5:4 --style raw --s 150 --v 7',
    createdAt: '2025-07-04',
  },
];
