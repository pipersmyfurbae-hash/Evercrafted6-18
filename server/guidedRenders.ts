import type { GuidedFloralRole } from "./guidedFlorals";

export type RenderPackageItem = {
  role: GuidedFloralRole;
  familyKey: string;
  commonName: string;
  selectionRationale: string | null;
};

export function compileRenderPackageManifest(input: {
  recipeId: number;
  recipeVersion: number;
  blueprintId: number;
  blueprintVersion: number;
  hierarchy: unknown;
  derivationNotes: unknown;
  items: RenderPackageItem[];
}) {
  return {
    contractVersion: "evercrafted_render_package_v1",
    source: {
      recipe: { id: input.recipeId, version: input.recipeVersion },
      blueprint: { id: input.blueprintId, version: input.blueprintVersion },
    },
    selectedRoles: input.items.map(item => ({
      role: item.role,
      familyKey: item.familyKey,
      commonName: item.commonName,
      selectionRationale: item.selectionRationale,
    })),
    simplifiedBlueprint: { hierarchy: input.hierarchy, derivationNotes: input.derivationNotes },
    rendererRule: "Visualize the approved design without redesigning it or inventing materials.",
    exclusions: [
      "quantity",
      "sku",
      "vendor",
      "supplier_cost",
      "stock",
      "reservation",
      "geometry",
      "construction",
      "provider_credential",
      "provider_task",
      "price",
      "checkout",
      "publication",
    ],
  };
}
