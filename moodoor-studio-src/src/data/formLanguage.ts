/**
 * Per-form render language. Every field here answers a question Midjourney will
 * otherwise answer badly on its own: what is this object called, what is it
 * built on, where is it mounted, what is behind it, where does the light come
 * from, and where is it deliberately bare.
 *
 * `drop_negatives` removes a `--no` token that would contradict the form —
 * a candle ring is meant to be centred; a kraft-wrapped stem bundle is a bouquet.
 */
export interface FormLanguage {
  noun: string;
  base: string;
  mount: string;
  setting: string;
  light: string;
  negative_space: string;
  drop_negatives?: string[];
}

export const FORM_LANGUAGE: Record<string, FormLanguage> = {
  E1: {
    noun: "grande wreath",
    base: "grapevine ring wreath",
    mount: "wall-mounted, full wreath in frame",
    setting: "pale warm grey textured plaster wall",
    light: "soft daylight from upper left",
    negative_space: "right arc 1:30 to 5:30 o'clock completely bare dark brown grapevine — intentional structural feature not a gap",
  },
  E2: {
    noun: "hero wreath",
    base: "grapevine ring wreath",
    mount: "wall-mounted, full wreath in frame",
    setting: "pale warm grey textured plaster wall",
    light: "soft daylight from upper left",
    negative_space: "right arc 1:30 to 5:30 o'clock completely bare dark brown grapevine — intentional structural feature not a gap",
  },
  E3: {
    noun: "entry tree pair",
    base: "cone topiary tree pair",
    mount: "flanking an entryway, both trees in frame",
    setting: "warm limewashed entry wall and stone step underfoot",
    light: "soft daylight from upper left",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  E4: {
    noun: "foyer arrangement",
    base: "tall vessel arrangement",
    mount: "in a floor vessel, full arrangement in frame",
    setting: "warm plaster foyer wall, wide oak floorboards below",
    light: "soft daylight from upper left",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  E5: {
    noun: "threshold treatment",
    base: "header swag with drops",
    mount: "mounted above a doorway header, full swag in frame",
    setting: "painted doorway header and warm plaster wall",
    light: "soft daylight from upper left",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  E6: {
    noun: "lamp neck wreath pair",
    base: "small collar wreath pair",
    mount: "collared around lamp necks, both pieces in frame",
    setting: "softly lit console table against a warm plaster wall",
    light: "soft daylight from upper left",
    negative_space: "right arc 1:30 to 5:30 o'clock completely bare dark brown grapevine — intentional structural feature not a gap",
  },
  E7: {
    noun: "door swag",
    base: "gathered swag",
    mount: "mounted to a door or wall, full swag in frame",
    setting: "deep painted panelled door",
    light: "soft daylight from upper left",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  D1: {
    noun: "puddle post",
    base: "crown cascade greenery treatment on a single post",
    mount: "wrapped around a single porch post cascading and puddling onto the floor, full cascade in frame",
    setting: "covered porch, painted post and weathered decking",
    light: "soft daylight from upper left",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  D2: {
    noun: "interior threshold swag",
    base: "header swag",
    mount: "mounted above an interior doorway, full swag in frame",
    setting: "painted interior door casing and warm plaster wall",
    light: "soft daylight from upper left",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  D3: {
    noun: "staircase cascade",
    base: "linear taper garland cascade",
    mount: "trailing down a stair railing, full cascade in frame",
    setting: "stained oak stair railing and pale stairwell wall",
    light: "soft daylight from upper left",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  A1: {
    noun: "mantel garland",
    base: "linear directional garland",
    mount: "draped along a mantel, full garland in frame",
    setting: "aged stone mantel shelf and warm plaster chimney breast",
    light: "soft daylight from upper left",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  A2: {
    noun: "chandelier treatment",
    base: "frame wrap with cascade",
    mount: "wrapped around a chandelier frame with trailing cascade, full fixture in frame",
    setting: "dim dining room ceiling",
    light: "warm ambient light",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  A3: {
    noun: "bookcase cascade",
    base: "crown-to-floor greenery cascade",
    mount: "trailing down a bookcase, full cascade in frame",
    setting: "painted built-in bookcase with worn book spines",
    light: "soft daylight from upper left",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  A4: {
    noun: "bookcase shelf drape",
    base: "trailing greenery cluster",
    mount: "draped along a bookcase shelf, full drape in frame",
    setting: "painted bookshelf, worn book spines behind",
    light: "soft daylight from upper left",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  A5: {
    noun: "stove surround garland",
    base: "linear surround garland",
    mount: "framing a stove hood, full garland in frame",
    setting: "plastered range hood and zellige tile splashback",
    light: "soft daylight from upper left",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  A6: {
    noun: "kitchen ledge garland",
    base: "linear garland",
    mount: "laid along a kitchen ledge, full garland in frame",
    setting: "honed stone kitchen ledge",
    light: "soft window light",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  R1: {
    noun: "chair wreath set",
    base: "small classic wreath set",
    mount: "mounted to chair backs, full set in frame",
    setting: "rush-seat dining chairs, warm dining room behind",
    light: "soft daylight from upper left",
    negative_space: "right arc 1:30 to 5:30 o'clock completely bare dark brown grapevine — intentional structural feature not a gap",
  },
  R2: {
    noun: "cabinet wreath pair",
    base: "small classic wreath pair",
    mount: "mounted to cabinet fronts, both wreaths in frame",
    setting: "painted shaker cabinet fronts with aged brass hardware",
    light: "soft daylight from upper left",
    negative_space: "right arc 1:30 to 5:30 o'clock completely bare dark brown grapevine — intentional structural feature not a gap",
  },
  R3: {
    noun: "lamp neck wreath set",
    base: "small collar wreath set",
    mount: "collared around lamp necks, full set in frame",
    setting: "softly lit side table against a warm plaster wall",
    light: "soft daylight from upper left",
    negative_space: "right arc 1:30 to 5:30 o'clock completely bare dark brown grapevine — intentional structural feature not a gap",
  },
  R4: {
    noun: "window wreath",
    base: "small greenery wreath",
    mount: "mounted to a window pane, full wreath in frame",
    setting: "divided-light window",
    light: "soft grey daylight beyond",
    negative_space: "right arc 1:30 to 5:30 o'clock completely bare dark brown grapevine — intentional structural feature not a gap",
  },
  R5: {
    noun: "pantry door wreath",
    base: "small classic wreath",
    mount: "mounted to a pantry door, full wreath in frame",
    setting: "painted pantry door with aged brass knob",
    light: "soft daylight from upper left",
    negative_space: "right arc 1:30 to 5:30 o'clock completely bare dark brown grapevine — intentional structural feature not a gap",
  },
  R6: {
    noun: "candle ring set",
    base: "small candle ring set",
    mount: "encircling candle bases on a tablescape, full set in frame",
    setting: "linen-dressed table surface",
    light: "low candlelight",
    negative_space: "right arc 1:30 to 5:30 o'clock completely bare dark brown grapevine — intentional structural feature not a gap",
    drop_negatives: ["centered"],
  },
  R7: {
    noun: "lantern collar",
    base: "radial asymmetric collar wreath",
    mount: "collaring the base of a lantern, full collar in frame",
    setting: "weathered lanterns on a stone step",
    light: "dusk light",
    negative_space: "right arc 1:30 to 5:30 o'clock completely bare dark brown grapevine — intentional structural feature not a gap",
  },
  R8: {
    noun: "table centerpiece",
    base: "low vessel centerpiece arrangement, botanicals seated in a shallow footed vessel",
    mount: "resting at the center of a dining table, full arrangement in frame, shot slightly above eye level",
    setting: "bare oak dining table surface",
    light: "soft window light from the left",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
    drop_negatives: ["centered"],
  },
  S1: {
    noun: "tabletop tree",
    base: "small tabletop tree",
    mount: "standing on a tabletop, full tree in frame",
    setting: "bare oak side table, warm plaster wall softly out of focus behind",
    light: "soft daylight from upper left",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  S2: {
    noun: "kissing ball",
    base: "spherical kissing ball",
    mount: "hanging from a ribbon, full sphere in frame",
    setting: "pale plaster ceiling and wall",
    light: "soft daylight",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  S3: {
    noun: "dough bowl arrangement",
    base: "dough bowl filler arrangement",
    mount: "nested in a wooden dough bowl, full arrangement in frame",
    setting: "worn wooden dough bowl on a linen-dressed table",
    light: "soft daylight from upper left",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
    drop_negatives: ["centered"],
  },
  S4: {
    noun: "bottle brush tree trio",
    base: "graduated trio of three bottle brush trees, tallest to shortest",
    mount: "standing in a graduated row on a surface, all three trees in frame",
    setting: "bare oak surface",
    light: "soft window light",
    negative_space: "tapering to bare structure at the trailing end — intentional negative space not a gap",
  },
  S5: {
    noun: "moon wreath",
    base: "moon-shaped wreath",
    mount: "wall-mounted, full wreath in frame",
    setting: "pale warm grey textured plaster wall",
    light: "soft daylight from upper left",
    negative_space: "right arc 1:30 to 5:30 o'clock completely bare dark brown grapevine — intentional structural feature not a gap",
  },
  S6: {
    noun: "hoop wreath",
    base: "open hoop wreath with ribbon tail",
    mount: "wall-mounted, full hoop in frame",
    setting: "pale warm grey textured plaster wall",
    light: "soft daylight from upper left",
    negative_space: "right arc 1:30 to 5:30 o'clock completely bare dark brown grapevine — intentional structural feature not a gap",
  },
  P1: {
    noun: "icicle accent pack",
    base: "loose clusters of clear glass icicle ornaments on wired stems",
    mount: "arranged as an overhead flat-lay on a pale surface, all stems in frame, no wreath no ring",
    setting: "pale washed linen surface",
    light: "flat even daylight from above",
    negative_space: "generous empty space around the stems, nothing crowded",
    drop_negatives: ["centered"],
  },
  P2: {
    noun: "stem bundle",
    base: "bundle of 6 loose stems wrapped in kraft paper",
    mount: "laid as an overhead flat-lay, kraft paper sleeve tied with twine, full bundle in frame, no wreath no ring",
    setting: "pale oak surface",
    light: "flat even daylight from above",
    negative_space: "generous empty space around the stems, nothing crowded",
    drop_negatives: ["centered","bouquet"],
  },
};

/**
 * Construction spec mirrored from PRODUCT_LIBRARY — scale, formula and the
 * ribbon rule. 22 of the 32 forms carry a bow; the other 10 must be told
 * explicitly not to, or Midjourney adds one anyway.
 */
export interface ProductFormSpec {
  name: string;
  scale: string;
  formula: string;
  bow: boolean;
  ribbon_tail?: boolean;
}

export const PRODUCT_FORMS: Record<string, ProductFormSpec> = {
  E1: { name: "Grande Wreath", scale: "26-30in", formula: "Heavy Crescent Extended", bow: true },
  E2: { name: "Hero Wreath", scale: "22-26in", formula: "Heavy Crescent", bow: true },
  E3: { name: "Entry Tree Pair", scale: "matched pair", formula: "Cone Topiary", bow: true },
  E4: { name: "Foyer Arrangement", scale: "24-36in", formula: "Tall Vessel Asymmetric", bow: true },
  E5: { name: "Threshold Treatment", scale: "full doorway width", formula: "Header Swag + Drops", bow: true },
  E6: { name: "Lamp Neck Wreath Pair", scale: "2x 8-10in", formula: "Collar", bow: true },
  E7: { name: "Door Swag", scale: "18-30in", formula: "Gathered Swag", bow: true },
  D1: { name: "The Puddle Post", scale: "single post, floor-length", formula: "Crown Cascade Puddle", bow: true },
  D2: { name: "Interior Threshold", scale: "door width", formula: "Header Swag Light", bow: true },
  D3: { name: "Staircase Cascade", scale: "rail length", formula: "Linear Taper", bow: true },
  A1: { name: "Mantel Garland", scale: "48-60in", formula: "Linear Directional", bow: true },
  A2: { name: "Chandelier Treatment", scale: "full fixture", formula: "Frame Wrap + Cascade", bow: true },
  A3: { name: "Bookcase Cascade", scale: "crown to floor", formula: "Crown to Floor", bow: true },
  A4: { name: "Bookcase Shelf Drape", scale: "shelf width", formula: "Trailing Cluster", bow: false },
  A5: { name: "Stove Surround Garland", scale: "hood width", formula: "Linear Surround", bow: true },
  A6: { name: "Kitchen Ledge Garland", scale: "24-36in", formula: "Linear Simple", bow: false },
  R1: { name: "Chair Wreath Set", scale: "set of 4, 10in each", formula: "Classic Asymmetric", bow: true },
  R2: { name: "Cabinet Wreath Pair", scale: "pair of 2, 8in each", formula: "Classic Asymmetric", bow: false },
  R3: { name: "Lamp Neck Wreath Set", scale: "set of 2, 8in each", formula: "Collar", bow: true },
  R4: { name: "Window Wreath", scale: "8-12in", formula: "Classic Asymmetric", bow: false },
  R5: { name: "Pantry Door Wreath", scale: "8-10in", formula: "Classic Asymmetric", bow: true },
  R6: { name: "Candle Ring Set", scale: "set of 2, 8in each", formula: "Asymmetric Cluster", bow: false },
  R7: { name: "Lantern Collar", scale: "collaring the lantern base", formula: "Radial Asymmetric", bow: true },
  R8: { name: "Table Centerpiece", scale: "8-14in", formula: "Low Vessel", bow: true },
  S1: { name: "Tabletop Tree", scale: "12-24in", formula: "Cone Wrapped", bow: true },
  S2: { name: "Kissing Ball", scale: "8-14in", formula: "Sphere", bow: true },
  S3: { name: "Dough Bowl", scale: "bowl width", formula: "Low Sprawling", bow: false },
  S4: { name: "Bottle Brush Trees", scale: "graduated trio, 3 pieces", formula: "Graduated Trio", bow: false },
  S5: { name: "Moon Wreath", scale: "18-24in", formula: "Half Crescent", bow: true },
  S6: { name: "Hoop Wreath", scale: "16-22in", formula: "Asymmetric Cluster", bow: false, ribbon_tail: true },
  P1: { name: "Icicle Accent Pack", scale: "loose clusters", formula: "Glass Icicle", bow: false },
  P2: { name: "Stem Bundle", scale: "6 stems", formula: "Kraft Wrapped", bow: true },
};
