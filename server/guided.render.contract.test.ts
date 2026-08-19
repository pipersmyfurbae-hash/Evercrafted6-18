import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileRenderPackageManifest } from "./guidedRenders";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");

const items = [
  { role: "PRIMARY_FOCAL" as const, familyKey: "BF-PEONY", commonName: "Peony", selectionRationale: "Carries the remembered tenderness." },
  { role: "SUPPORTING_FLORAL" as const, familyKey: "BF-RANUNCULUS", commonName: "Ranunculus", selectionRationale: "Frames the focal presence." },
  { role: "DIRECTIONAL_ACCENT" as const, familyKey: "BF-DELPHINIUM", commonName: "Delphinium", selectionRationale: "Carries movement outward." },
  { role: "GREENERY_MOVEMENT" as const, familyKey: "BG-EUCALYPTUS", commonName: "Eucalyptus", selectionRationale: "Holds the movement field." },
];

describe("Guided Wreath Render Package — Checkpoint D", () => {
  it("compiles a deterministic provenance manifest with the contract version and explicit exclusions", () => {
    const manifest = compileRenderPackageManifest({ recipeId: 11, recipeVersion: 2, blueprintId: 22, blueprintVersion: 3, hierarchy: [{ role: "PRIMARY_FOCAL" }], derivationNotes: ["Derived only from the locked Recipe."], items });
    expect(manifest.contractVersion).toBe("evercrafted_render_package_v1");
    expect(manifest.source).toEqual({ recipe: { id: 11, version: 2 }, blueprint: { id: 22, version: 3 } });
    expect(manifest.selectedRoles.map(item => item.role)).toEqual(items.map(item => item.role));
    expect(manifest.exclusions).toEqual(expect.arrayContaining(["quantity", "sku", "vendor", "supplier_cost", "stock", "reservation", "geometry", "construction", "provider_credential", "provider_task", "price", "checkout", "publication"]));
  });

  it("requires a locked Recipe and ready Blueprint before package preparation", () => {
    const persistence = read("server/guidedRendersDb.ts");
    expect(persistence).toContain('eq(guidedWreathRecipes.status, "locked")');
    expect(persistence).toContain('eq(guidedWreathBlueprints.status, "ready")');
    expect(persistence).toContain("Lock a current Recipe before preparing a render package.");
    expect(persistence).toContain("Generate a current simplified Blueprint before preparing a render package.");
  });

  it("allows approval only from a draft package and manual handoff only from an approved package", () => {
    const persistence = read("server/guidedRendersDb.ts");
    expect(persistence).toContain('eq(guidedRenderPackages.status, "draft")');
    expect(persistence).toContain("A current draft render package is required for approval.");
    expect(persistence).toContain('eq(guidedRenderPackages.status, "approved")');
    expect(persistence).toContain("Approve a current render package before requesting a manual handoff.");
  });

  it("keeps the manifest clear of commercial, provider, image, and publication payload data", () => {
    const manifest = compileRenderPackageManifest({ recipeId: 1, recipeVersion: 1, blueprintId: 2, blueprintVersion: 1, hierarchy: [], derivationNotes: [], items });
    for (const forbiddenKey of ["quantity", "sku", "vendor", "supplierCost", "stock", "reservation", "geometry", "construction", "providerCredential", "providerTask", "price", "checkout", "image", "publication"]) {
      expect(manifest).not.toHaveProperty(forbiddenKey);
    }
    const persistence = read("server/guidedRendersDb.ts");
    expect(persistence).not.toContain("imageGeneration");
    expect(persistence).not.toContain("storagePut");
  });

  it("propagates later source invalidation to render packages and manual handoff history", () => {
    const recipes = read("server/guidedRecipesDb.ts");
    expect(recipes).toContain("guidedRenderPackages");
    expect(recipes).toContain("guidedManualRenderHandoffs");
    expect(recipes).toContain('set({ status: "stale", staleReason: input.reason, staleAt: new Date() })');
    expect(recipes).toContain("inArray(guidedManualRenderHandoffs.renderPackageId, packageIds)");
  });
});
