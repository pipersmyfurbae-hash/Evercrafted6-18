import { describe, expect, it } from "vitest";
import { buildGuidedFloralCandidates, evaluateGuidedFloralCompatibility, guidedFloralRoles, referenceBotanicalCatalog } from "./guidedFlorals";

const signals = {
  paletteDirection: "warm ivory and sage",
  floralFormQualities: ["rounded", "cluster"],
  greeneryMotionQualities: ["sweeping", "branching"],
  textureQualities: ["matte", "velvety"],
  directionalFlow: "lifting and directional",
  avoidances: [],
};

describe("Guided Florals Checkpoint B", () => {
  it("creates transparent family-level candidates for each required role without inventory claims", () => {
    const candidates = buildGuidedFloralCandidates(signals);
    guidedFloralRoles.forEach(role => expect(candidates.some(candidate => candidate.role === role)).toBe(true));
    expect(candidates.every(candidate => candidate.explanation.includes("not a live availability or purchase claim"))).toBe(true);
    expect(JSON.stringify(referenceBotanicalCatalog)).not.toMatch(/sku|vendor|price|stock|quantity/i);
  });

  it("requires one selection for every role before Recipe remains a reviewed next checkpoint", () => {
    const incomplete = evaluateGuidedFloralCompatibility([{ role: "PRIMARY_FOCAL", familyKey: "BF-PEONY", provenance: "reference_fixture" }]);
    expect(incomplete.outcome).toBe("blocked");
    expect(incomplete.checks.some(check => check.key === "missing_supporting_floral" && check.status === "blocked")).toBe(true);

    const complete = evaluateGuidedFloralCompatibility([
      { role: "PRIMARY_FOCAL", familyKey: "BF-PEONY", provenance: "reference_fixture" },
      { role: "SUPPORTING_FLORAL", familyKey: "BF-RANUNCULUS", provenance: "reference_fixture" },
      { role: "DIRECTIONAL_ACCENT", familyKey: "BF-DELPHINIUM", provenance: "reference_fixture" },
      { role: "GREENERY_MOVEMENT", familyKey: "BG-EUCALYPTUS", provenance: "reference_fixture" },
    ]);
    expect(complete.outcome).toBe("pass");
  });
});
