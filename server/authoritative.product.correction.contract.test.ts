import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");

describe("authoritative Evercrafted product correction", () => {
  const inventory = read("docs/architecture/AUTHORITATIVE_PRODUCT_HANDOFF_INVENTORY.md");
  const plan = read("docs/roadmap/AUTHORITATIVE_PRODUCT_CORRECTION_PLAN.md");

  it("anchors the product to the approved memory-to-wreath sequence", () => {
    expect(inventory).toContain("Memory → Essence → Story → Guided Florals → Recipe → Blueprint → Render → Outcome");
    expect(plan).toContain("Memory → Essence → Story → Guided Florals → Recipe → Blueprint → Render → Outcome");
  });

  it("separates guided Wreath Creation, Signature Wreaths, and Moodoor Studio", () => {
    ["Create From a Memory", "Signature Wreath Collection", "Evercrafted Studio"].forEach(entry => expect(plan).toContain(entry));
    expect(plan).toContain("Guided Journey Shell");
    expect(plan).toContain("render → upload → analyze → package → publish");
  });

  it("locks source grounding and avoids fictional inventory, pricing, and outcome claims in the first increment", () => {
    expect(plan).toContain("must not fabricate sample memories");
    expect(plan).toContain("Do not show fake candidates");
    expect(plan).toContain("No price, checkout, reservation, or availability claim");
    expect(plan).toContain("Story cannot select flowers, inventory, roles, or geometry");
  });
});
