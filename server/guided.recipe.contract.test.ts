import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileSimplifiedBlueprint } from "./guidedRecipes";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");

const completeItems = [
  { role: "PRIMARY_FOCAL" as const, familyKey: "BF-PEONY", commonName: "Peony", selectionRationale: null },
  { role: "SUPPORTING_FLORAL" as const, familyKey: "BF-RANUNCULUS", commonName: "Ranunculus", selectionRationale: null },
  { role: "DIRECTIONAL_ACCENT" as const, familyKey: "BF-DELPHINIUM", commonName: "Delphinium", selectionRationale: null },
  { role: "GREENERY_MOVEMENT" as const, familyKey: "BG-EUCALYPTUS", commonName: "Eucalyptus", selectionRationale: null },
];

describe("Guided Wreath Recipe and Blueprint — Checkpoint C", () => {
  it("derives a deterministic four-role simplified Blueprint from a locked Recipe snapshot", () => {
    const blueprint = compileSimplifiedBlueprint({ recipeVersion: 2, roleSetVersion: 3, items: completeItems });
    expect(blueprint.hierarchy.map(item => item.role)).toEqual(["PRIMARY_FOCAL", "SUPPORTING_FLORAL", "DIRECTIONAL_ACCENT", "GREENERY_MOVEMENT"]);
    expect(blueprint.hierarchy.map(item => item.commonName)).toEqual(["Peony", "Ranunculus", "Delphinium", "Eucalyptus"]);
    expect(blueprint.derivationNotes.join(" ")).toContain("locked Recipe v2");
  });

  it("rejects a missing required role instead of silently producing a partial Blueprint", () => {
    expect(() => compileSimplifiedBlueprint({ recipeVersion: 1, roleSetVersion: 1, items: completeItems.slice(0, 3) })).toThrow("GREENERY MOVEMENT");
  });

  it("requires a passing compatibility snapshot, writes inside a transaction, and preserves Recipe/Blueprint stale propagation", () => {
    const persistence = read("server/guidedRecipesDb.ts");
    const florals = read("server/guidedFloralsDb.ts");
    expect(persistence).toContain('compatibility.outcome !== "pass"');
    expect(persistence).toContain("await db.transaction");
    expect(persistence).toContain('status: "stale"');
    expect(florals).toContain("A saved ${selected.candidate.role.replaceAll");
    expect(florals).toContain("guidedWreathBlueprints");
  });

  it("keeps the simplified Blueprint outside inventory, quantity, render, provider, and checkout scope", () => {
    const contract = read("docs/architecture/RECIPE_BLUEPRINT_CONTRACT.md");
    expect(contract).toContain("not an inventory reservation");
    expect(contract).toContain("Exact quantity, stem count, BOM");
    expect(contract).toContain("render prompt, provider task, render asset, publication, checkout, or delivery");
  });
});
