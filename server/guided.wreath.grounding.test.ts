import { describe, expect, it } from "vitest";
import { safeFallback, validateGrounding, type GroundedDraft } from "./guidedWreath";

const sourceMemory = "Sunday mornings at the kitchen window felt quiet and warm.";

const draft: GroundedDraft = {
  essence: {
    emotionalCenter: "Held warmth",
    atmosphere: "Quiet continuation",
    movement: "A reaching gesture",
    visualTension: "Soft contrast",
    paletteDirection: "Warm ivory",
    expression: "A reflective interpretation for review.",
    avoidances: [],
  },
  story: {
    excerpt: "Sunday mornings at the kitchen window.",
    body: "Sunday mornings at the kitchen window felt quiet and warm. Her grandmother had died.",
    designSignals: {
      primaryEmotion: "Warmth",
      secondaryEmotion: "Continuity",
      atmosphere: "Quiet",
      paletteDirection: "Warm ivory",
      textureQualities: [],
      directionalFlow: "Reaching",
      focalCharacter: "Gathered",
      negativeSpaceMeaning: "Pause",
      floralFormQualities: [],
      greeneryMotionQualities: [],
      avoidances: [],
    },
  },
  sourceDetails: ["Sunday mornings at the kitchen window", "a red porch"],
  unsupportedClaims: [],
};

describe("guided Wreath source grounding", () => {
  it("retains only exact supplied source details and flags unsupported biographical claims", () => {
    const result = validateGrounding(sourceMemory, draft);
    expect(result.sourceDetails).toEqual(["Sunday mornings at the kitchen window"]);
    expect(result.unsupportedClaims).toContain("Unverified source detail: a red porch");
    expect(result.unsupportedClaims).toContain("Potential unsupported biographical claim: died");
    expect(result.unsupportedClaims).toContain("Potential unsupported biographical claim: grandmother");
  });

  it("keeps unavailable model output as a labelled fallback rather than fictional completion", () => {
    const result = safeFallback(sourceMemory);
    expect(result.story.body).toBe(sourceMemory);
    expect(result.unsupportedClaims[0]).toContain("fallback");
    expect(result.essence.avoidances).toContain("Do not invent facts beyond the memory.");
  });
});
