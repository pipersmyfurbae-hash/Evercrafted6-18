/**
 * Engine smoke test — exercises the pure logic (recipes, EVS projection, render
 * prompts, validator) against the real inventory canon, with no browser or API.
 *
 *   npm run smoke
 */
import { readFileSync } from 'node:fs';
import type { Inventory } from '../src/types/inventory';
import type { LibraryItem, Material } from '../src/types/library';
import { PRODUCT_LIBRARY } from '../src/data/productLibrary';
import { FORM_LANGUAGE, PRODUCT_FORMS } from '../src/data/formLanguage';
import { buildLibraryItems, buildWholehomeLibraryItems } from '../src/lib/recipes';
import { buildFormPrompts, buildHeroPrompt, buildShotSet, formLang } from '../src/lib/prompts';
import { SHOTS, SHOT_BY_KEY, VERIFYING_SHOTS } from '../src/data/cameras';
import {
  angleInRange,
  complementRanges,
  describeSector,
  mergeRanges,
  rangeOverlap,
  subtractArc,
} from '../src/lib/geometry';
import { composeRing, gravityFromPoints } from '../src/lib/placement';
import { normalizeSeason } from '../src/lib/selection';
import {
  blueprintFromLibraryItem,
  buildHumanPrompt,
  buildMachinePrompt,
  buildMachineShotSet,
  degToClock,
} from '../src/lib/composer';
import { gradeForScore, scorePrompt } from '../src/lib/validator';
import { predictedEvsFromMaterials } from '../src/lib/evs';

const inv = JSON.parse(readFileSync('public/moodoor-inventory.json', 'utf8')) as Inventory;

let failures = 0;
function check(label: string, ok: boolean, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label}${detail ? ` — ${detail}` : ''}`);
}

console.log('\n── Canon ──');
check('43 species loaded', inv.species.length === 43);
check('551 SKUs declared', inv.sku_count_total === 551);
check('5 register gaps', inv.register_gaps.length === 5, inv.register_gaps.join(', '));
check('32 product forms', Object.keys(PRODUCT_LIBRARY).length === 32);
check(
  'form codes aligned across all three tables',
  ['E1', 'A1', 'R6', 'P2', 'S6'].every((c) => PRODUCT_LIBRARY[c] && PRODUCT_FORMS[c] && FORM_LANGUAGE[c]),
);
const bowed = Object.values(PRODUCT_FORMS).filter((f) => f.bow).length;
const tailed = Object.values(PRODUCT_FORMS).filter((f) => !f.bow && f.ribbon_tail).length;
check('23 forms carry a bow, 8 carry none, 1 carries a ribbon tail',
  bowed === 23 && tailed === 1 && 32 - bowed - tailed === 8, `${bowed}/${tailed}`);
check('S6 hoop wreath gets a ribbon tail, not a bow', formLang('S6').ribbon === 'a single ribbon tail, no bow');

console.log('\n── Recipes from a hierarchy package ──');
const { items, gaps } = buildLibraryItems(
  {
    collectionName: 'Ash & Ember',
    emotionTags: ['grounded'],
    hierarchy: [
      { role: 'Hero', name: 'Ember Door', form: 'wreath', formula: 'Crescent', scale: '24in', price: 165, keyMaterials: 'amber dahlia, lavender, cotton stem', notes: '' },
      { role: 'Accent', name: 'Ember Picks', form: 'picks', formula: 'Scatter', scale: '6in', price: 28, keyMaterials: 'pip berry', notes: '' },
    ],
  },
  inv,
);
check('one LibraryItem per hierarchy product', items.length === 2);
check('materials sourced', items.every((i) => i.materials.length >= 3));
check(
  'every material is a real in-stock SKU',
  items.every((i) =>
    i.materials.every((m) => inv.species.some((s) => s.species === m.species && s.sku_count > 0)),
  ),
);
check('zero-stock species surfaced as gaps', gaps.includes('Lavender') && gaps.includes('Cotton Stem'), gaps.join(', '));
check('cost estimate is positive', items.every((i) => i.cost_estimate > 0));
check(
  'predicted EVS covers all 7 axes in range',
  items.every((i) =>
    Object.values(i.predicted_evs).length === 7 &&
    Object.values(i.predicted_evs).every((v) => v >= 0.02 && v <= 0.98),
  ),
  JSON.stringify(items[0].predicted_evs),
);

console.log('\n── Whole-home recipes ──');
const wh = buildWholehomeLibraryItems(
  {
    collectionName: 'Winter Wakes',
    products: [
      { formCode: 'A1', name: 'Mantel Garland', role: 'Atmospheric Filler', layer: 3, scale: '48-60in', formula: 'Linear Directional', price: '$165-$215' },
      { formCode: 'D3', name: 'Staircase Cascade', role: 'Supporting', layer: 2, scale: 'Rail', formula: 'Linear Taper', price: '$185-$295' },
      { formCode: 'P2', name: 'Stem Bundle', role: 'Accent', layer: 1, scale: '6 stems', formula: 'Kraft Wrapped', price: '$22-$38' },
    ],
  },
  inv,
);
check('one item per selected form', wh.items.length === 3);
check('greenery-only forms flagged', wh.items[1].greener_only === true && wh.items[0].greener_only === false);
check('form codes carried through', wh.items.map((i) => i.form_code).join(',') === 'A1,D3,P2');

console.log('\n── Render prompts speak the right product ──');
const mantel = wh.items[0];
const { prompts: mantelPrompts } = buildFormPrompts(mantel, inv);
check('mantel hero says "mantel garland"', mantelPrompts.hero.includes('mantel garland'));
check('mantel hero never says "wreath"', !/\bwreath\b/.test(mantelPrompts.hero), mantelPrompts.hero.slice(0, 90));
check('mantel hero states real scale', mantelPrompts.hero.includes('48-60in, Linear Directional construction'));
check('mantel hero applies the bow rule', mantelPrompts.hero.includes('hand-tied ribbon bow'));
check('mantel hero is v7 with no --q', mantelPrompts.hero.includes('--v 7') && !mantelPrompts.hero.includes('--q'));
check('mantel hero has no :: weighting', !mantelPrompts.hero.includes('::'));

const cascade = wh.items[1];
const cascadePrompts = buildFormPrompts(cascade, inv).prompts;
check('greenery-only form gets a greenery base phase', !!cascadePrompts.greenery);
check('greenery base says GREENERY ONLY', cascadePrompts.greenery.includes('GREENERY ONLY'));
check(
  'foliage-only item still names real blooms in hero (register fallback)',
  /FOCAL:/.test(cascadePrompts.hero),
  cascadePrompts.hero.match(/FOCAL: [^,]+/)?.[0] ?? 'none',
);

const bundle = wh.items[2];
const bundlePrompts = buildFormPrompts(bundle, inv).prompts;
check('bow form is told to add one', bundlePrompts.hero.includes('hand-tied ribbon bow'));
check(
  'stem bundle drops the contradicting "bouquet" negative',
  !/--no[^]*\bbouquet\b/.test(bundlePrompts.hero),
);
check('flat-lay form uses its own light', bundlePrompts.hero.includes('flat even daylight from above'));
// R6 candle rings carry no bow at all, and are meant to be centred.
const ring = buildWholehomeLibraryItems(
  { products: [{ formCode: 'R6', name: 'Candle Ring Set', role: 'Accent', layer: 4, scale: '2x8in', formula: 'Asymmetric Cluster', price: '$55-$75' }] },
  inv,
).items[0];
const ringHero = buildFormPrompts(ring, inv).prompts.hero;
check('bow-less form is told not to add one', ringHero.includes('no bow, no ribbon'));
check('candle ring drops the contradicting "centered" negative', !/--no[^]*\bcentered\b/.test(ringHero));

console.log('\n── No empty tokens for a form-less wreath ──');
const bespoke = items[0];
const bespokeHero = buildHeroPrompt(bespoke, 'hero', inv);
check('form-less wreath prompt has no ", ," gap', !bespokeHero.includes(', ,'), bespokeHero.slice(0, 110));
check('form-less wreath still reads as a wreath', bespokeHero.includes('faux botanical wreath'));
check('no empty token anywhere in the mantel prompt', !mantelPrompts.hero.includes(', ,'));
check('no empty token in the greenery base', !cascadePrompts.greenery.includes(', ,'));

console.log('\n── Camera layer: six angles, one subject ──');
const mantelLang = formLang(mantel.form_code);
const set = buildShotSet(mantel, inv);
check('every camera angle is built', SHOTS.every((sh) => !!set[sh.key]), Object.keys(set).join(','));
check('exactly two angles verify the blueprint', VERIFYING_SHOTS.length === 2, VERIFYING_SHOTS.join(','));

// The whole point of the layer: the words describing the piece are byte-identical
// across the set, so six renders read as one wreath rather than six wreaths.
const beforeCamera = (p: string) => p.slice(0, p.indexOf(', ' + SHOT_BY_KEY.hero.camera));
const heroSubject = beforeCamera(set.hero);
check('hero and three-quarter share an identical subject', heroSubject === set.threeQuarter.slice(0, heroSubject.length));
check('hero and profile share an identical subject', heroSubject === set.profile.slice(0, heroSubject.length));
check('subject is non-trivial', heroSubject.length > 200, `${heroSubject.length} chars`);

check('each angle carries its own camera bundle', SHOTS.every((sh) => set[sh.key].includes(sh.camera)));
check('each angle carries its own aspect ratio', SHOTS.every((sh) => set[sh.key].includes(`--ar ${sh.ar}`)));
check('stylize is constant across the set', SHOTS.every((sh) => set[sh.key].includes('--s 100')));
check('every angle is v7 with no --q', SHOTS.every((sh) => set[sh.key].includes('--v 7') && !set[sh.key].includes('--q')));
check('no angle uses :: weighting', SHOTS.every((sh) => !set[sh.key].includes('::')));
check('no angle has a ", ," gap', SHOTS.every((sh) => !set[sh.key].includes(', ,')), SHOTS.filter((sh) => set[sh.key].includes(', ,')).map((sh) => sh.key).join(',') || 'none');

// Macro crops past the bare arc, so naming it would invite grapevine into a
// frame that should be nothing but petal.
check('macro drops the silence-arc clause', !set.macro.includes(mantelLang.negative_space || 'negative space sentinel'));
check('hero keeps the silence-arc clause', set.hero.includes(mantelLang.negative_space ?? ''));

// Flat lay is the one angle that cannot hold the wall mount constant.
check('flat lay replaces the wall mount', set.flatlay.includes('directly above') && !set.flatlay.includes(mantelLang.mount));
check('flat lay still names the same stems', set.flatlay.includes('FOCAL:') && heroSubject.includes('FOCAL:'));
check('flat lay negates perspective distortion', /--no[^]*perspective distortion/.test(set.flatlay));

// Blueprint path gets the same treatment.
const bpSet = buildMachineShotSet(blueprintFromLibraryItem(mantel));
check('blueprint path builds all six angles', SHOTS.every((sh) => !!bpSet[sh.key]));
check('blueprint angles carry their own --ar', SHOTS.every((sh) => bpSet[sh.key].includes(`--ar ${sh.ar}`)));
check('blueprint hero keeps the silence arc', bpSet.hero.includes("o'clock left bare"));
check('blueprint macro drops the silence arc', !bpSet.macro.includes("o'clock left bare"));

/** Minimal material factory for the geometry checks. */
const mat = (primary_role: Material['primary_role'], species: string, qty: number): Material => ({
  sku: species, species, canon_id: 'c', color_name: 'Ivory', primary_hex: '#eee', price: 8, primary_role, qty,
});

console.log('\n── The brief actually reaches the stock ──');
const XMAS = 'London with Ralph Lauren at Christmas';
check('a holiday reads as a season', normalizeSeason(undefined, XMAS) === 'winter', String(normalizeSeason(undefined, XMAS)));
check('harvest language reads as fall', normalizeSeason(undefined, 'a Cotswold harvest table in late October') === 'fall');
check('an unreadable brief resolves to nothing rather than guessing', normalizeSeason(undefined, 'something calm and grey') === undefined);

const xmasPkg = {
  collectionName: 'Belgravia Christmas',
  season: 'Winter',
  emotionTags: ['celebration', 'reverence', 'grandeur'],
  palette: [{ name: 'Oxblood', hex: '#6B2126' }, { name: 'Deep Evergreen', hex: '#1F3B2C' }, { name: 'Antique Gold', hex: '#B08D3F' }],
  hierarchy: [
    { role: 'Premium Anchor', name: 'Eaton Square', keyMaterials: 'Holly Berry, Blue Cedar, Champagne Peony' },
    { role: 'Hero', name: 'Mayfair', keyMaterials: 'Pine Bough, White Ranunculus' },
  ],
};
const autumnPkg = {
  collectionName: 'Cotswold Harvest',
  season: 'Autumn',
  emotionTags: ['nostalgia', 'comfort'],
  palette: [{ name: 'Rust', hex: '#8C4A28' }],
  hierarchy: [{ role: 'Premium Anchor', name: 'Barn Door', keyMaterials: 'Toasted Oak Leaf, Dried Strawflower, Golden Dahlia' }],
};

const xmasItems = buildLibraryItems(xmasPkg as never, inv, XMAS).items;
const autumnItems = buildLibraryItems(autumnPkg as never, inv, 'a Cotswold harvest table in late October').items;
const xmasSpecies = xmasItems.flatMap((i) => i.materials.map((m) => m.species));
const autumnSpecies = autumnItems.flatMap((i) => i.materials.map((m) => m.species));

check('the species the generation named actually get sourced', ['Holly Berry', 'Blue Cedar', 'Pine Bough', 'Champagne Peony', 'White Ranunculus'].some((n) => xmasSpecies.includes(n)), xmasSpecies.join(', '));
check('two different briefs source different stock', xmasSpecies.join() !== autumnSpecies.join(), autumnSpecies.join(', '));
check('no fall-tagged species in a Christmas collection', !xmasSpecies.some((n) => (inv.species.find((s) => s.species === n)?.seasonality) === 'fall'), xmasSpecies.filter((n) => inv.species.find((s) => s.species === n)?.seasonality === 'fall').join(', ') || 'none');
check('the same brief sources the same stock twice', buildLibraryItems(xmasPkg as never, inv, XMAS).items.flatMap((i) => i.materials.map((m) => m.sku)).join() === xmasItems.flatMap((i) => i.materials.map((m) => m.sku)).join());
check("the brief's own register survives into the recipe", xmasItems[0].emotional_tags.includes('celebration'), xmasItems[0].emotional_tags.join(', '));
check('a recipe never names one species twice', xmasItems.every((i) => new Set(i.materials.map((m) => m.species)).size === i.materials.length));
check('the collection season is carried onto the recipe', xmasItems[0].season === 'winter');

console.log('\n── The prompt says what season it is ──');
const xmasPrompt = buildMachinePrompt(blueprintFromLibraryItem(xmasItems[0]));
check('season reaches the compiled prompt', xmasPrompt.includes('winter seasonal register'));
check('palette reaches the compiled prompt', xmasPrompt.includes('Oxblood'));
check('emotional register reaches the compiled prompt', xmasPrompt.includes('celebration'), xmasPrompt.match(/celebration[^,]*/)?.[0] ?? 'MISSING');
// "Blue Cedar — Rust" locked the species word and compiled "(true saturated blue)".
check('the colour lock follows the colourway, not the species name', !/Blue Cedar — Rust \(true saturated blue\)/.test(xmasPrompt));

console.log('\n── Arc algebra (ported from the Placement Engine) ──');
check('complement of one arc is its gap', JSON.stringify(complementRanges([{ start: 0, span: 90 }])) === JSON.stringify([{ start: 90, span: 270 }]));
check('complement of full cover is empty', complementRanges([{ start: 0, span: 360 }]).length === 0);
check('complement of nothing is the whole circle', complementRanges([])[0].span === 360);
check('merge rejoins across the 0/360 seam', mergeRanges([{ start: 350, span: 20 }, { start: 10, span: 20 }]).length === 1);
check('subtracting an interior hole yields two arcs', subtractArc({ start: 0, span: 100 }, { start: 40, span: 20 }).length === 2);
check('subtracting an edge hole yields one arc', subtractArc({ start: 0, span: 100 }, { start: 0, span: 20 }).length === 1);
check('overlap is measured across the seam', rangeOverlap({ start: 350, span: 20 }, { start: 0, span: 20 }) === 10);
check('sector naming is clock-convention', describeSector(0) === 'top' && describeSector(90) === 'right' && describeSector(180) === 'bottom' && describeSector(270) === 'left');

console.log('\n── Placement: silence arcs are measured, not asserted ──');
const sparse = { id: 'li_sparse', recipe_name: 'S', materials: [mat('focal', 'Garden Rose', 3)] } as LibraryItem;
const dense = { id: 'li_dense', recipe_name: 'D', materials: [mat('focal', 'Peony', 9), mat('focal', 'Dahlia', 7), mat('secondary', 'Ranunculus', 9), mat('secondary', 'Lisianthus', 7), mat('accent', 'Waxflower', 5)] } as LibraryItem;
const cSparse = composeRing(sparse);
const cDense = composeRing(dense);

check('rest is the exact complement of what was placed', (() => {
  const covered = cDense.placements.reduce((sum, p) => sum + p.range.span, 0);
  const rest = cDense.restZones.reduce((sum, r) => sum + r.span, 0);
  return Math.abs(covered + rest - 360) < 1e-6;
})());
check('more material leaves less rest', cDense.restZones[0].span < cSparse.restZones[0].span, `${Math.round(cDense.restZones[0].span)}° vs ${Math.round(cSparse.restZones[0].span)}°`);
check('the formula is read off the geometry, not fixed', cSparse.formula !== cDense.formula, `${cSparse.formula} / ${cDense.formula}`);
check('placement is deterministic per item', JSON.stringify(composeRing(sparse)) === JSON.stringify(cSparse));
check('different items land differently', composeRing({ ...sparse, id: 'li_other' }).placements[0].range.start !== cSparse.placements[0].range.start);
check('gravity points into the worked mass', angleInRange(cSparse.gravity.deg, cSparse.placements[0].range));
check('an empty recipe is all rest', composeRing({ id: 'x', recipe_name: 'x', materials: [] } as unknown as LibraryItem).restZones[0].span === 360);

// The defect this replaced: every blueprint claimed 82°–168° regardless of input.
const bpSparse = blueprintFromLibraryItem(sparse);
const bpDense = blueprintFromLibraryItem(dense);
check('blueprints no longer share one hard-coded silence arc', JSON.stringify(bpSparse.silence_arcs) !== JSON.stringify(bpDense.silence_arcs), JSON.stringify(bpSparse.silence_arcs));
check('cluster angles are no longer evenly spaced', (() => {
  const a = (bpDense.clusters ?? []).map((c) => c.angle_deg ?? 0);
  const gaps = a.slice(1).map((deg, i) => deg - a[i]);
  return new Set(gaps.map((g) => Math.round(g))).size > 1;
})());
check('the wreath prompt names the measured rest, not a canned arc', (() => {
  const p = buildHeroPrompt(sparse, 'hero', inv);
  return p.includes('leaving the') && p.includes('bare') && !p.includes("1:30 to 5:30");
})(), buildHeroPrompt(sparse, 'hero', inv).match(/visual weight[^,]*/)?.[0] ?? 'none');
check('a coded form keeps its own spatial language', buildHeroPrompt(mantel, 'hero', inv).includes(mantelLang.negative_space ?? ''));

check('the blueprint prompt names measured gravity when there is one', buildMachinePrompt(bpSparse).includes('visual weight gathered toward the'), buildMachinePrompt(bpSparse).match(/visual weight[^,]*/)?.[0] ?? 'none');
// Evenly-spread mass has no honest direction, so none is claimed — the
// Placement Engine's 0.12 concentration floor, kept rather than papered over.
check('evenly distributed mass claims no direction', gravityFromPoints([{ deg: 0, weight: 1 }, { deg: 120, weight: 1 }, { deg: 240, weight: 1 }]).concentration < 0.12);
check('a coded-form blueprint gets no ring gravity', !buildMachinePrompt({ ...bpSparse, form_code: 'A1' }).includes('visual weight gathered'));

console.log('\n── Odd stem counts ──');
const oddOk = /(\d+)x /.exec(mantelPrompts.hero);
check('quantities render as odd counts', !!oddOk && Number(oddOk[1]) % 2 === 1, oddOk?.[0]);

console.log('\n── Blueprint composer ──');
check('degToClock 0° is 12:00', degToClock(0) === '12:00');
check('degToClock 90° is 3:00', degToClock(90) === '3:00');
check('degToClock 271° reads 9:00', degToClock(271) === '9:00', degToClock(271));

const bp = {
  blueprint_id: 'EC_WR_V2_4217',
  formula: 'Crescent',
  canvas: { diameter_in: 24 },
  silence_arcs: [{ from_deg: 82, to_deg: 168 }],
  clusters: [
    { type: 'focal', angle_deg: 305, stems: [{ name: 'Blue Hydrangea', qty: 1 }] },
    { type: 'secondary', angle_deg: 332, stems: [{ name: 'White Ranunculus', qty: 3 }] },
  ],
  foliage_sweeps: [{ name: 'Sage', arc_from: 187, arc_to: 372 }],
};

const machineWreath = buildMachinePrompt(bp);
check('wreath blueprint reads as a wreath', machineWreath.includes('faux botanical wreath'));
check('named color is locked saturated', machineWreath.includes('(true saturated blue)'), 'machine');
check('focal is named first as dominant', machineWreath.includes('Blue Hydrangea (true saturated blue) as the single dominant focal cluster'));
check('silence arc stated in clock positions', machineWreath.includes("2:45–5:35 o'clock left bare"),
  machineWreath.match(/[\d:]+–[\d:]+ o'clock left bare/)?.[0] ?? 'absent');

const machineMantel = buildMachinePrompt({ ...bp, form_code: 'A1' });
check('form_code override switches the noun', machineMantel.includes('faux botanical mantel garland'));
check('form_code override drops ring-only silence language', !machineMantel.includes("o'clock left bare"));

const human = buildHumanPrompt(bp, {
  ATMOSPHERE: 'Airy spring restraint.',
  'EDITORIAL VOICE': 'Quiet editorial calm.',
});
check('human prompt front-loads the color lock', human.includes('rendered true and saturated'));
check('human prompt avoids "photorealistic"', !/photorealistic/i.test(human));

console.log('\n── Validator ──');
const good = scorePrompt(machineWreath)!;
check('machine prompt scores', good.score > 0, `${good.score} / ${gradeForScore(good.score).label}`);
check('nine checks run', good.checks.length === 9);
console.log('       failing checks on the composed wreath prompt:');
good.checks.filter((c) => !c.pass).forEach((c) => console.log(`         · ${c.label}`));
const bad = scorePrompt('a photorealistic thing::2 --ar 1:1 --frobnicate')!;
check('flags banned realism keyword', !bad.checks.find((c) => c.label.includes('realism'))!.pass);
check('flags :: weighting as invalid v7', !bad.checks.find((c) => c.label.includes('Parameter'))!.pass);
check('flags missing subject', !bad.checks.find((c) => c.label.includes('Subject'))!.pass);

console.log('\n── EVS projection responds to composition ──');
const warm: LibraryItem['materials'] = inv.species
  .filter((s) => s.primary_emotion === 'comfort' && s.sku_count > 0)
  .slice(0, 3)
  .map((s) => ({
    sku: s.skus[0].sku, species: s.species, canon_id: s.canon_id,
    color_name: s.skus[0].color_name, primary_hex: s.skus[0].hex,
    price: s.skus[0].price, primary_role: s.skus[0].primary_role, qty: 5,
  }));
if (warm.length) {
  const v = predictedEvsFromMaterials(warm, inv);
  check('comfort-led recipe reads warmer than baseline 0.4', v.warmth > 0.4, `warmth ${v.warmth}`);
}

console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}\n`);
process.exit(failures === 0 ? 0 : 1);
