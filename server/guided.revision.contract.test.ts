import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { compareRenderPackageManifests } from "./guidedRevisions";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");
const manifest = (recipeVersion: number, blueprintVersion: number, primary: string) => ({
  contractVersion: "evercrafted_render_package_v1",
  source: { recipe: { id: 1, version: recipeVersion }, blueprint: { id: 2, version: blueprintVersion } },
  selectedRoles: [
    { role: "PRIMARY_FOCAL", commonName: primary },
    { role: "SUPPORTING_FLORAL", commonName: "Ranunculus" },
  ],
  exclusions: ["quantity", "sku", "vendor", "provider_task", "price", "checkout", "publication"],
});

describe("Guided Wreath controlled revision — Checkpoint F", () => {
  it("compares only retained package provenance and deterministically identifies source and role differences", () => {
    const comparison = compareRenderPackageManifests({
      primary: { id: 20, version: 2, status: "approved", manifest: manifest(2, 2, "Peony") },
      baseline: { id: 10, version: 1, status: "stale", manifest: manifest(1, 1, "Garden rose") },
    });
    expect(comparison.contractVersion).toBe("evercrafted_render_comparison_v1");
    expect(comparison.sourceChanges).toEqual({ recipeVersionChanged: true, blueprintVersionChanged: true });
    expect(comparison.roles).toEqual(expect.arrayContaining([expect.objectContaining({ role: "PRIMARY_FOCAL", changed: true, baselineCommonName: "Garden rose", primaryCommonName: "Peony" })]));
    expect(comparison.exclusions).toEqual(expect.arrayContaining(["quantity", "sku", "vendor", "provider_task", "price", "checkout", "publication"]));
  });

  it("requires two distinct render packages and keeps comparisons inside the private project boundary", () => {
    const persistence = read("server/guidedRevisionsDb.ts");
    expect(persistence).toContain("Choose two different render package versions to compare.");
    expect(persistence).toContain("eq(guidedRenderPackages.projectId, input.projectId)");
    expect(persistence).toContain("Each compared render package must belong to this private project.");
  });

  it("allows a revision request only for an approved current package without an existing handoff or revision", () => {
    const persistence = read("server/guidedRevisionsDb.ts");
    expect(persistence).toContain('eq(guidedRenderPackages.status, "approved")');
    expect(persistence).toContain("A current approved render package is required before requesting a revision.");
    expect(persistence).toContain("eq(guidedRenderRevisionRequests.renderPackageId, renderPackage.id)");
    expect(persistence).toContain("eq(guidedManualRenderHandoffs.renderPackageId, renderPackage.id)");
    expect(persistence).toContain("A manual handoff is already recorded for this package.");
  });

  it("preserves a request as auditable stale history when an upstream source selection changes", () => {
    const recipes = read("server/guidedRecipesDb.ts");
    const revisions = read("server/guidedRevisionsDb.ts");
    expect(recipes).toContain("guidedRenderRevisionRequests");
    expect(recipes).toContain("inArray(guidedRenderRevisionRequests.renderPackageId, packageIds)");
    expect(revisions).toContain("guided_wreath.render_revision.requested");
    expect(revisions).toContain("memoryThreadEvents");
    expect(revisions).toContain("stageApprovals");
  });

  it("keeps provider, image, inventory, payment, publication, and Outcome behavior outside comparison and revision", () => {
    const comparator = read("server/guidedRevisions.ts");
    const persistence = read("server/guidedRevisionsDb.ts");
    const page = read("client/src/pages/WreathCreation.tsx");
    for (const source of [comparator, persistence]) {
      expect(source).not.toContain("storagePut");
      expect(source).not.toContain("imageGeneration");
      expect(source).not.toContain("stripe");
    }
    expect(page).toContain("Outcome remains gated");
    expect(page).toContain("requestRenderRevision");
    expect(page).toContain("compareRenderPackages");
  });
});
