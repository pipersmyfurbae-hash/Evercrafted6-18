import { guidedFloralRoles, type GuidedFloralRole } from "./guidedFlorals";

export type RecipeHierarchyItem = {
  role: GuidedFloralRole;
  familyKey: string;
  commonName: string;
  selectionRationale: string | null;
};

const roleNarrative: Record<GuidedFloralRole, string> = {
  PRIMARY_FOCAL: "holds the concentrated emotional center",
  SUPPORTING_FLORAL: "frames the focal presence without competing for it",
  DIRECTIONAL_ACCENT: "carries the eye outward with a measured directional gesture",
  GREENERY_MOVEMENT: "creates the movement field around the floral hierarchy",
};

export function compileSimplifiedBlueprint(input: { recipeVersion: number; roleSetVersion: number; items: RecipeHierarchyItem[] }) {
  const byRole = new Map(input.items.map(item => [item.role, item]));
  const hierarchy = guidedFloralRoles.map(role => {
    const item = byRole.get(role);
    if (!item) throw new Error(`The locked Recipe is missing ${role.replaceAll("_", " ")}`);
    return {
      role,
      familyKey: item.familyKey,
      commonName: item.commonName,
      description: `${item.commonName} ${roleNarrative[role]}.`,
      customerRationale: item.selectionRationale,
    };
  });

  return {
    hierarchy,
    derivationNotes: [
      `Derived deterministically from locked Recipe v${input.recipeVersion} and Guided Florals role set v${input.roleSetVersion}.`,
      "This is a simplified hierarchy summary, not a build instruction.",
      "No quantity, stem count, inventory resolution, SKU, vendor, geometry, render prompt, or purchase detail is represented.",
    ],
  };
}
