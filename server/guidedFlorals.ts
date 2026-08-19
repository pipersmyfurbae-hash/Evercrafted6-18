export const GUIDED_FLORAL_CATALOG_VERSION = "moodoor.reference-fixture.v1";

export const guidedFloralRoles = ["PRIMARY_FOCAL", "SUPPORTING_FLORAL", "DIRECTIONAL_ACCENT", "GREENERY_MOVEMENT"] as const;
export type GuidedFloralRole = (typeof guidedFloralRoles)[number];

export type ReferenceBotanical = {
  familyKey: string;
  commonName: string;
  category: "floral" | "greenery";
  roleHints: GuidedFloralRole[];
  formCapabilities: string[];
  movementCapabilities: string[];
  surfaceQualities: string[];
  paletteFamilies: string[];
};

export const referenceBotanicalCatalog: ReferenceBotanical[] = [
  { familyKey: "BF-PEONY", commonName: "Peony", category: "floral", roleHints: ["PRIMARY_FOCAL"], formCapabilities: ["mass", "cup", "rounded"], movementCapabilities: ["contained"], surfaceQualities: ["matte", "velvety"], paletteFamilies: ["warm ivory", "soft blush", "deep burgundy"] },
  { familyKey: "BF-HYDRANGEA", commonName: "Hydrangea", category: "floral", roleHints: ["PRIMARY_FOCAL", "SUPPORTING_FLORAL"], formCapabilities: ["mass", "cluster", "rounded"], movementCapabilities: ["contained"], surfaceQualities: ["matte", "soft"], paletteFamilies: ["warm ivory", "sage", "dusty blue"] },
  { familyKey: "BF-RANUNCULUS", commonName: "Ranunculus", category: "floral", roleHints: ["SUPPORTING_FLORAL"], formCapabilities: ["cup", "cluster", "rounded"], movementCapabilities: ["contained", "punctuating"], surfaceQualities: ["matte", "velvety"], paletteFamilies: ["warm ivory", "soft blush", "rust"] },
  { familyKey: "BF-DELPHINIUM", commonName: "Delphinium", category: "floral", roleHints: ["DIRECTIONAL_ACCENT"], formCapabilities: ["spire", "line"], movementCapabilities: ["lifting", "reaching", "directional"], surfaceQualities: ["papery", "matte"], paletteFamilies: ["dusty blue", "soft blush", "warm ivory"] },
  { familyKey: "BF-THISTLE", commonName: "Thistle", category: "floral", roleHints: ["DIRECTIONAL_ACCENT"], formCapabilities: ["orb", "spike"], movementCapabilities: ["punctuating", "static"], surfaceQualities: ["papery", "frosted"], paletteFamilies: ["dusty blue", "silver green", "deep burgundy"] },
  { familyKey: "BG-EUCALYPTUS", commonName: "Eucalyptus", category: "greenery", roleHints: ["GREENERY_MOVEMENT"], formCapabilities: ["branch", "line"], movementCapabilities: ["sweeping", "reaching", "branching"], surfaceQualities: ["broad leaf", "matte"], paletteFamilies: ["sage", "silver green"] },
  { familyKey: "BG-RUSCUS", commonName: "Ruscus", category: "greenery", roleHints: ["GREENERY_MOVEMENT"], formCapabilities: ["line", "branch"], movementCapabilities: ["sweeping", "lifting", "branching"], surfaceQualities: ["fine leaf", "broad leaf"], paletteFamilies: ["sage", "deep green"] },
  { familyKey: "BG-FERN", commonName: "Fern", category: "greenery", roleHints: ["GREENERY_MOVEMENT"], formCapabilities: ["spray", "airy", "trailing"], movementCapabilities: ["cascading", "drifting", "trailing"], surfaceQualities: ["fine leaf", "papery"], paletteFamilies: ["sage", "silver green"] },
];

type FloralSignals = {
  paletteDirection: string;
  floralFormQualities: string[];
  greeneryMotionQualities: string[];
  textureQualities: string[];
  directionalFlow: string;
  avoidances: string[];
};

export type FloralCandidateDraft = {
  role: GuidedFloralRole;
  familyKey: string;
  rank: number;
  explanation: string;
  matchEvidence: string[];
  tensionNotes: string[];
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function signalTerms(signals: FloralSignals) {
  return normalize([
    signals.paletteDirection,
    signals.directionalFlow,
    ...signals.floralFormQualities,
    ...signals.greeneryMotionQualities,
    ...signals.textureQualities,
  ].join(" "));
}

function explainCandidate(item: ReferenceBotanical, role: GuidedFloralRole, evidence: string[]) {
  const roleCopy: Record<GuidedFloralRole, string> = {
    PRIMARY_FOCAL: "holds the one concentrated focal role",
    SUPPORTING_FLORAL: "frames the focal presence without competing for dominance",
    DIRECTIONAL_ACCENT: "carries a measured directional release",
    GREENERY_MOVEMENT: "builds the movement field around the floral hierarchy",
  };
  return `${item.commonName} is a reference family that ${roleCopy[role]}. ${evidence.length ? `It echoes ${evidence.join(", ")}.` : "Its role capability is available for your review."} This is not a live availability or purchase claim.`;
}

export function buildGuidedFloralCandidates(signals: FloralSignals): FloralCandidateDraft[] {
  const terms = signalTerms(signals);
  const avoided = normalize(signals.avoidances.join(" "));
  return guidedFloralRoles.flatMap(role => referenceBotanicalCatalog
    .filter(item => item.roleHints.includes(role))
    .map(item => {
      const capabilityWords = [...item.formCapabilities, ...item.movementCapabilities, ...item.surfaceQualities, ...item.paletteFamilies];
      const evidence = capabilityWords.filter(value => terms.includes(normalize(value))).slice(0, 3);
      const tensionNotes = avoided.includes(normalize(item.commonName)) ? [`${item.commonName} appears in an avoidance note and should be reviewed before selection.`] : [];
      return { item, evidence, tensionNotes, weight: evidence.length * 10 + (item.roleHints[0] === role ? 3 : 0) };
    })
    .sort((left, right) => right.weight - left.weight || left.item.commonName.localeCompare(right.item.commonName))
    .slice(0, 3)
    .map(({ item, evidence, tensionNotes }, index) => ({
      role,
      familyKey: item.familyKey,
      rank: index + 1,
      explanation: explainCandidate(item, role, evidence),
      matchEvidence: evidence.length ? evidence : ["Role capability from the approved reference catalog"],
      tensionNotes,
    })));
}

export type TraySelection = { role: GuidedFloralRole; familyKey: string; provenance: string };
export type FloralCompatibilityStatus = "pass" | "warning" | "blocked";
export type FloralCompatibilityCheck = { key: string; status: FloralCompatibilityStatus; message: string };

export function evaluateGuidedFloralCompatibility(selections: TraySelection[]): { outcome: FloralCompatibilityStatus; checks: FloralCompatibilityCheck[] } {
  const checks: FloralCompatibilityCheck[] = [];
  const roleCounts = new Map<GuidedFloralRole, number>();
  selections.forEach(selection => roleCounts.set(selection.role, (roleCounts.get(selection.role) ?? 0) + 1));

  const primaryCount = roleCounts.get("PRIMARY_FOCAL") ?? 0;
  checks.push(primaryCount === 1
    ? { key: "primary_focal", status: "pass", message: "One primary focal role is selected." }
    : { key: "primary_focal", status: "blocked", message: primaryCount ? "Only one primary focal role may be selected." : "Choose one primary focal role before continuing." });

  guidedFloralRoles.filter(role => !roleCounts.has(role)).forEach(role => checks.push({ key: `missing_${role.toLowerCase()}`, status: "blocked", message: `${role.replaceAll("_", " ")} still needs a selection.` }));
  if (new Set(selections.map(selection => selection.familyKey)).size < 2 && selections.length > 1) checks.push({ key: "family_repetition", status: "warning", message: "The current tray repeats one botanical family. This may be deliberate, but review it before Recipe lock." });
  if (selections.some(selection => selection.provenance !== "reference_fixture" && selection.provenance !== "vetted")) checks.push({ key: "catalog_provenance", status: "blocked", message: "A selected reference does not have approved catalog provenance." });
  if (!checks.some(check => check.key === "family_repetition")) checks.push({ key: "family_repetition", status: "pass", message: "The tray carries more than one botanical family." });

  const outcome: FloralCompatibilityStatus = checks.some(check => check.status === "blocked") ? "blocked" : checks.some(check => check.status === "warning") ? "warning" : "pass";
  return { outcome, checks };
}
