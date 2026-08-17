import type { WholehomeProduct } from '../types/collection';

/**
 * The 32-form whole-home product library (Evercrafted sightline system).
 * Layer 1 ENTRY · Layer 2 DRAW · Layer 3 ANCHOR · Layer 4 DISCOVERY,
 * plus Specialty forms and Accent Packs.
 *
 * This is the canon: `scale`, `formula`, `bow` and `greenerOnly` are read
 * straight into render-prompt language so the two can never drift apart.
 */
export interface ProductForm {
  name: string;
  layer: 1 | 2 | 3 | 4;
  role: string;
  scale: string;
  formula: string;
  price: string;
  bow: boolean;
  greenerOnly: boolean;
}

export const PRODUCT_LIBRARY: Record<string, ProductForm> = {
  E1: { name: "Grande Wreath", layer: 1, role: "Premium Anchor", scale: "26-30in", formula: "Heavy Crescent Extended", price: "$295-$385", bow: true, greenerOnly: false },
  E2: { name: "Hero Wreath", layer: 1, role: "Hero", scale: "22-26in", formula: "Heavy Crescent", price: "$185-$245", bow: true, greenerOnly: false },
  E3: { name: "Entry Tree Pair", layer: 1, role: "Supporting", scale: "Pair", formula: "Cone Topiary", price: "$265-$395", bow: true, greenerOnly: false },
  E4: { name: "Foyer Arrangement", layer: 1, role: "Supporting", scale: "24-36in", formula: "Tall Vessel Asymmetric", price: "$215-$285", bow: true, greenerOnly: false },
  E5: { name: "Threshold Treatment", layer: 1, role: "Supporting", scale: "Full", formula: "Header Swag + Drops", price: "$185-$265", bow: true, greenerOnly: false },
  E6: { name: "Lamp Neck Wreath Pair", layer: 1, role: "Accent", scale: "8-10in", formula: "Collar", price: "$75-$95", bow: true, greenerOnly: false },
  E7: { name: "Door Swag", layer: 1, role: "Supporting", scale: "18-30in", formula: "Gathered Swag", price: "$95-$135", bow: true, greenerOnly: false },
  D1: { name: "The Puddle Post", layer: 2, role: "Supporting", scale: "Post", formula: "Crown Cascade Puddle", price: "$265-$365", bow: true, greenerOnly: true },
  D2: { name: "Interior Threshold", layer: 2, role: "Supporting", scale: "Door", formula: "Header Swag Light", price: "$125-$175", bow: true, greenerOnly: false },
  D3: { name: "Staircase Cascade", layer: 2, role: "Supporting", scale: "Rail", formula: "Linear Taper", price: "$185-$295", bow: true, greenerOnly: true },
  A1: { name: "Mantel Garland", layer: 3, role: "Atmospheric Filler", scale: "48-60in", formula: "Linear Directional", price: "$165-$215", bow: true, greenerOnly: false },
  A2: { name: "Chandelier Treatment", layer: 3, role: "Atmospheric Filler", scale: "Fixture", formula: "Frame Wrap + Cascade", price: "$195-$285", bow: true, greenerOnly: false },
  A3: { name: "Bookcase Cascade", layer: 3, role: "Supporting", scale: "Height", formula: "Crown to Floor", price: "$125-$185", bow: true, greenerOnly: true },
  A4: { name: "Bookcase Shelf Drape", layer: 3, role: "Accent", scale: "Shelf", formula: "Trailing Cluster", price: "$45-$85", bow: false, greenerOnly: true },
  A5: { name: "Stove Surround Garland", layer: 3, role: "Supporting", scale: "Width", formula: "Linear Surround", price: "$145-$225", bow: true, greenerOnly: true },
  A6: { name: "Kitchen Ledge Garland", layer: 3, role: "Supporting", scale: "24-36in", formula: "Linear Simple", price: "$85-$125", bow: false, greenerOnly: true },
  R1: { name: "Chair Wreath Set", layer: 4, role: "Accent", scale: "4x10in", formula: "Classic Asymmetric", price: "$125-$165", bow: true, greenerOnly: false },
  R2: { name: "Cabinet Wreath Pair", layer: 4, role: "Accent", scale: "2x8in", formula: "Classic Asymmetric", price: "$55-$85", bow: false, greenerOnly: true },
  R3: { name: "Lamp Neck Wreath Set", layer: 4, role: "Accent", scale: "2x8in", formula: "Collar", price: "$65-$95", bow: true, greenerOnly: false },
  R4: { name: "Window Wreath", layer: 4, role: "Accent", scale: "8-12in", formula: "Classic Asymmetric", price: "$55-$85", bow: false, greenerOnly: true },
  R5: { name: "Pantry Door Wreath", layer: 4, role: "Accent", scale: "8-10in", formula: "Classic Asymmetric", price: "$45-$65", bow: true, greenerOnly: false },
  R6: { name: "Candle Ring Set", layer: 4, role: "Accent", scale: "2x8in", formula: "Asymmetric Cluster", price: "$55-$75", bow: false, greenerOnly: false },
  R7: { name: "Lantern Collar", layer: 4, role: "Accent", scale: "Base", formula: "Radial Asymmetric", price: "$85-$125", bow: true, greenerOnly: false },
  R8: { name: "Table Centerpiece", layer: 4, role: "Accent", scale: "8-14in", formula: "Low Vessel", price: "$95-$145", bow: true, greenerOnly: false },
  S1: { name: "Tabletop Tree", layer: 1, role: "Supporting", scale: "12-24in", formula: "Cone Wrapped", price: "$85-$185", bow: true, greenerOnly: false },
  S2: { name: "Kissing Ball", layer: 1, role: "Accent", scale: "8-14in", formula: "Sphere", price: "$75-$125", bow: true, greenerOnly: false },
  S3: { name: "Dough Bowl", layer: 3, role: "Supporting", scale: "Bowl", formula: "Low Sprawling", price: "$125-$185", bow: false, greenerOnly: false },
  S4: { name: "Bottle Brush Trees", layer: 4, role: "Accent", scale: "3-piece", formula: "Graduated Trio", price: "$55-$85", bow: false, greenerOnly: false },
  S5: { name: "Moon Wreath", layer: 1, role: "Hero", scale: "18-24in", formula: "Half Crescent", price: "$125-$185", bow: true, greenerOnly: false },
  S6: { name: "Hoop Wreath", layer: 1, role: "Hero", scale: "16-22in", formula: "Asymmetric Cluster", price: "$95-$145", bow: false, greenerOnly: false },
  P1: { name: "Icicle Accent Pack", layer: 3, role: "Accent", scale: "Clusters", formula: "Glass Icicle", price: "$35-$55", bow: false, greenerOnly: false },
  P2: { name: "Stem Bundle", layer: 1, role: "Accent", scale: "6 stems", formula: "Kraft Wrapped", price: "$22-$38", bow: true, greenerOnly: false },
};

export const FORM_CODES = Object.keys(PRODUCT_LIBRARY);

/** Resolve a selected whole-home product against the canon, filling any gaps. */
export function resolveForm(p: Partial<WholehomeProduct> & { formCode?: string }) {
  const def = p.formCode ? PRODUCT_LIBRARY[p.formCode] : undefined;
  return {
    formCode: p.formCode ?? '',
    name: p.name || def?.name || p.formCode || '',
    role: p.role || def?.role || 'Accent',
    layer: p.layer ?? def?.layer ?? 4,
    scale: p.scale || def?.scale || '—',
    formula: p.formula || def?.formula || '—',
    price: p.price || def?.price || '—',
  };
}
