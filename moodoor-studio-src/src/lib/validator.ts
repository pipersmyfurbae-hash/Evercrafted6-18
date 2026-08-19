/**
 * Structural accuracy scoring for a Midjourney v7 prompt. Nine checks against
 * things that measurably change what comes back — token position, material
 * vocabulary, parameter syntax — not against style or taste.
 */

export interface PromptCheck {
  label: string;
  pass: boolean;
  note: string;
}

export interface PromptAnalysis {
  score: number;
  checks: PromptCheck[];
}

export interface Grade {
  label: string;
  cls: 'a' | 'b' | 'c' | 'd';
}

const SUBJECT_WORDS = [
  'wreath',
  'garland',
  'swag',
  'cascade',
  'tree',
  'bouquet',
  'arrangement',
  'centerpiece',
  'collar',
  'bundle',
];

const MATERIAL_WORDS = [
  'silk',
  'velvet',
  'preserved',
  'dried',
  'foam',
  'real touch',
  'bleached',
  'faux',
  'permanent botanical',
  'pu',
  'latex',
];

const LIGHTING_WORDS = [
  'softbox',
  'studio lighting',
  'window light',
  'golden hour',
  'rim lighting',
  'high-key',
  'high key',
  'diffused',
  'natural light',
  'daylight',
];

const BACKGROUND_WORDS = [
  'background',
  'backdrop',
  'isolated',
  'hanging on',
  'styled on',
  'flat lay',
  'plaster wall',
  'mounted',
];

/** Realism keywords that paradoxically push v7 toward a more artificial look. */
const BANNED_WORDS = [
  'photorealistic',
  'hyper-realistic',
  'hyperrealistic',
  'realistic photo',
  'flawless',
  'airbrushed',
  'perfect',
];

const KNOWN_PARAMS = [
  '--ar',
  '--style',
  '--s',
  '--c',
  '--q',
  '--no',
  '--v',
  '--seed',
  '--sref',
  '--sw',
  '--oref',
  '--ow',
  '--chaos',
  '--stylize',
  '--quality',
  '--draft',
  '--iw',
];

function hasWordMatch(text: string, word: string): boolean {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${esc}\\b`, 'i').test(text);
}

export function scorePrompt(prompt: string): PromptAnalysis | null {
  const raw = (prompt ?? '').trim();
  if (!raw) return null;

  const words = raw.split(/\s+/);
  const firstParamIdx = words.findIndex((w) => w.startsWith('--'));
  const mainWords = firstParamIdx === -1 ? words : words.slice(0, firstParamIdx);
  const paramWords = firstParamIdx === -1 ? [] : words.slice(firstParamIdx);
  const mainText = mainWords.join(' ').toLowerCase();
  const fullLower = raw.toLowerCase();

  const checks: PromptCheck[] = [];
  let score = 0;

  const first6 = mainWords.slice(0, 6).join(' ').toLowerCase();
  const hasSubject = SUBJECT_WORDS.some((w) => hasWordMatch(first6, w));
  checks.push({
    label: 'Subject named in first 6 words',
    pass: hasSubject,
    note: hasSubject
      ? 'Product type appears early, where it receives maximum prompt weight.'
      : 'Move the product type earlier — tokens at the end of a prompt carry far less influence.',
  });
  score += hasSubject ? 15 : 0;

  const hasMaterial = MATERIAL_WORDS.some((w) => hasWordMatch(mainText, w));
  checks.push({
    label: 'Faux material descriptor present',
    pass: hasMaterial,
    note: hasMaterial
      ? 'Material vocabulary (silk, preserved, dried, velvet…) is present.'
      : 'Add a material term or Midjourney may default toward fresh florist bouquets.',
  });
  score += hasMaterial ? 15 : 0;

  const hasAR = paramWords.includes('--ar');
  checks.push({
    label: 'Aspect ratio parameter (--ar)',
    pass: hasAR,
    note: hasAR
      ? 'Aspect ratio is locked for consistent framing.'
      : 'Add --ar (e.g. --ar 5:4) to control composition and cropping.',
  });
  score += hasAR ? 10 : 0;

  const hasStyleRaw = fullLower.includes('--style raw');
  checks.push({
    label: '--style raw present',
    pass: hasStyleRaw,
    note: hasStyleRaw
      ? "Raw mode engaged — prevents Midjourney's automatic beautification pass."
      : 'Add --style raw for literal, catalog-accurate interpretation.',
  });
  score += hasStyleRaw ? 10 : 0;

  const wc = mainWords.filter(Boolean).length;
  const wcPass = wc >= 15 && wc <= 40;
  const wcPartial = (wc >= 10 && wc < 15) || (wc > 40 && wc <= 55);
  checks.push({
    label: `Descriptive length (${wc} words)`,
    pass: wcPass,
    note: wcPass
      ? 'Within the 15–40 word zone where every token still carries meaningful weight.'
      : wcPartial
        ? 'Close — but trim or expand slightly. Tokens past ~40 words often score near zero.'
        : 'Outside the optimal range. Midjourney processes roughly 75 tokens total and ignores the tail.',
  });
  score += wcPass ? 15 : wcPartial ? 8 : 0;

  const hasLighting = LIGHTING_WORDS.some((w) => hasWordMatch(mainText, w));
  checks.push({
    label: 'Lighting specification',
    pass: hasLighting,
    note: hasLighting
      ? 'Lighting direction is defined.'
      : 'Add a lighting cue — softbox, window light, golden hour, diffused daylight.',
  });
  score += hasLighting ? 10 : 0;

  const hasBackground = BACKGROUND_WORDS.some((w) => hasWordMatch(mainText, w));
  checks.push({
    label: 'Background specification',
    pass: hasBackground,
    note: hasBackground
      ? 'Background context is defined.'
      : 'Specify a background — isolated white, styled on marble, hanging on a door.',
  });
  score += hasBackground ? 10 : 0;

  const foundBanned = BANNED_WORDS.filter((w) => hasWordMatch(fullLower, w));
  const bannedPass = foundBanned.length === 0;
  checks.push({
    label: 'No counterproductive realism keywords',
    pass: bannedPass,
    note: bannedPass
      ? "Clear of 'photorealistic / flawless / perfect' — these paradoxically read as more artificial."
      : `Remove: ${foundBanned.join(', ')}.`,
  });
  score += bannedPass ? 10 : Math.max(0, 10 - foundBanned.length * 5);

  const formatIssues = paramWords.filter((w) => w.startsWith('--') && !KNOWN_PARAMS.includes(w));
  const hasDoubleColon = raw.includes('::');
  const formatPass = formatIssues.length === 0 && !hasDoubleColon;
  const formatNoteParts: string[] = [];
  if (formatIssues.length) {
    formatNoteParts.push(`Unrecognized parameter(s): ${formatIssues.join(', ')}.`);
  }
  if (hasDoubleColon) {
    formatNoteParts.push(
      "Contains :: multi-prompt syntax — v7 doesn't support it. Remove :: and let word order/role phrasing carry the emphasis instead.",
    );
  }
  checks.push({
    label: 'Parameter formatting valid',
    pass: formatPass,
    note: formatPass
      ? 'All parameters use recognized v7 syntax, with no unsupported :: weighting.'
      : formatNoteParts.join(' '),
  });
  score += formatPass ? 5 : 2;

  return { score: Math.round(score), checks };
}

export function gradeForScore(score: number): Grade {
  if (score >= 90) return { label: 'Editorial-Ready', cls: 'a' };
  if (score >= 75) return { label: 'Strong — Minor Polish', cls: 'b' };
  if (score >= 60) return { label: 'Workable — Needs Revision', cls: 'c' };
  return { label: 'Rebuild Recommended', cls: 'd' };
}

export const GRADE_COLOR: Record<Grade['cls'], string> = {
  a: 'var(--ec-green)',
  b: '#7A8F3F',
  c: 'var(--ec-warning)',
  d: '#c0392b',
};
