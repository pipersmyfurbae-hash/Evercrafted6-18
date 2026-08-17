/**
 * The camera layer.
 *
 * A "camera" in a Midjourney v7 prompt is not one word — it is five correlated
 * cues (lens, framing distance, camera height, depth of field, aspect ratio).
 * Change one and the render lands between two looks; change them as a set and
 * you get a genuinely different photograph of the same object.
 *
 * The discipline that makes a set cohere: everything describing the *piece*
 * stays byte-identical across all six shots — same species, same quantities,
 * same word order, same negatives, same `--s`. Only the camera bundle and
 * `--ar` move. The moment the subject is reworded too, you stop photographing
 * one wreath and start generating six different wreaths.
 */

export type ShotKey = 'hero' | 'threeQuarter' | 'macro' | 'profile' | 'lifestyle' | 'flatlay';

export interface CameraShot {
  key: ShotKey;
  label: string;
  /** What this angle earns you — shown under the tab, not sent to Midjourney. */
  purpose: string;
  /** Lens, framing, height and depth of field, written as one bundle. */
  camera: string;
  ar: string;
  /**
   * True when the shot preserves the blueprint's polar geometry undistorted —
   * the only angles where a cluster's degree placement and a silence arc can
   * actually be checked against the blueprint that specified them. Off-axis
   * shots foreshorten exactly the angles you would be trying to verify.
   */
  verifies: boolean;
  /** Scene facts this angle has to override — a flat lay cannot stay wall-mounted. */
  setting?: string;
  mount?: string;
  /**
   * Suppress the spatial clause — where the mass sits and which arcs are bare.
   * A tight crop contains neither, so naming them only invites the wrong thing
   * into the frame.
   */
  dropNegativeSpace?: boolean;
  /** Failure modes belonging to this camera, not to the subject. */
  extraNegatives?: string[];
}

export const SHOTS: CameraShot[] = [
  {
    key: 'hero',
    label: 'Hero',
    purpose: 'The silhouette. Listing thumbnail, and the shot the blueprint is checked against.',
    camera:
      'straight-on frontal view perpendicular to the wall, camera level with the center of the piece, 85mm medium format, entire piece in frame with even margins, shallow depth of field falling off behind the focal cluster',
    ar: '4:5',
    verifies: true,
  },
  {
    key: 'threeQuarter',
    label: 'Three-Quarter',
    purpose: 'Proves it is a thick object, not a flat print. The most convincing single shot.',
    camera:
      'three-quarter view rotated forty degrees off-axis, camera slightly below center looking gently upward, 50mm, raking sidelight across the stems, front-to-back layering clearly separated in depth, moderate depth of field',
    ar: '4:5',
    verifies: false,
  },
  {
    key: 'macro',
    label: 'Macro',
    purpose: 'Fabric and petal texture — what separates luxury faux from craft store.',
    camera:
      'tight macro crop with the focal cluster filling the frame, 100mm macro lens angled forty-five degrees down across the petals, extremely shallow depth of field, individual petal edges and fabric weave resolved',
    ar: '4:5',
    verifies: false,
    // The bare arc is outside a tight crop; naming it invites bare grapevine
    // into a frame that should be nothing but petal.
    dropNegativeSpace: true,
  },
  {
    key: 'profile',
    label: 'Profile',
    purpose: 'Build depth and the base construction. The trust shot for a high-price piece.',
    camera:
      'dead side-on profile view, camera level with the piece at ninety degrees to the wall, the full depth of the build reading edge-on, stem insertion into the base visible, deep depth of field front to back',
    ar: '3:2',
    verifies: false,
  },
  {
    key: 'lifestyle',
    label: 'Lifestyle',
    purpose: 'Scale and emotional context — the piece where it will actually live.',
    camera:
      'wide environmental view from across the room, 35mm at standing eye level, piece occupying roughly one third of the frame, natural falloff, ambient room depth behind',
    ar: '4:5',
    verifies: false,
    setting:
      'in a styled interior room, surrounding architecture and furnishings visible for scale',
  },
  {
    key: 'flatlay',
    label: 'Flat Lay',
    purpose: 'Composition geometry read literally — the blueprint seen as a diagram.',
    camera:
      'directly overhead flat lay, camera perpendicular above the piece, 50mm, no perspective distortion, the entire composition readable at once, even shadowless light',
    ar: '1:1',
    verifies: true,
    setting: 'laid flat on a pale warm grey plaster surface',
    mount: 'photographed from directly above, entire piece flat in frame',
    extraNegatives: ['perspective distortion', 'tilted'],
  },
];

export const SHOT_BY_KEY: Record<string, CameraShot> = Object.fromEntries(
  SHOTS.map((s) => [s.key, s]),
);

/** The two angles that hold the blueprint's polar geometry true. */
export const VERIFYING_SHOTS = SHOTS.filter((s) => s.verifies).map((s) => s.key);
