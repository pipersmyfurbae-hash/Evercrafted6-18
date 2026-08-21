type RenderPackageManifest = {
  contractVersion?: string;
  source?: { recipe?: { id: number; version: number }; blueprint?: { id: number; version: number } };
  selectedRoles?: Array<{ role: string; commonName: string }>;
  exclusions?: string[];
};

type PackageSnapshot = { id: number; version: number; status: string; manifest: unknown };

function readManifest(value: unknown): RenderPackageManifest {
  if (!value || typeof value !== "object") return {};
  return value as RenderPackageManifest;
}

export function compareRenderPackageManifests(input: { primary: PackageSnapshot; baseline: PackageSnapshot }) {
  const primary = readManifest(input.primary.manifest);
  const baseline = readManifest(input.baseline.manifest);
  const roles = Array.from(new Set([...(primary.selectedRoles ?? []).map(item => item.role), ...(baseline.selectedRoles ?? []).map(item => item.role)]));
  return {
    contractVersion: "evercrafted_render_comparison_v1",
    primary: { id: input.primary.id, version: input.primary.version, status: input.primary.status, source: primary.source ?? null },
    baseline: { id: input.baseline.id, version: input.baseline.version, status: input.baseline.status, source: baseline.source ?? null },
    sourceChanges: {
      recipeVersionChanged: primary.source?.recipe?.version !== baseline.source?.recipe?.version,
      blueprintVersionChanged: primary.source?.blueprint?.version !== baseline.source?.blueprint?.version,
    },
    roles: roles.map(role => {
      const primaryRole = primary.selectedRoles?.find(item => item.role === role) ?? null;
      const baselineRole = baseline.selectedRoles?.find(item => item.role === role) ?? null;
      return { role, primaryCommonName: primaryRole?.commonName ?? null, baselineCommonName: baselineRole?.commonName ?? null, changed: primaryRole?.commonName !== baselineRole?.commonName };
    }),
    exclusions: Array.from(new Set([...(primary.exclusions ?? []), ...(baseline.exclusions ?? [])])).sort(),
    boundary: "Comparison reads retained provenance only. It does not create a render, modify a package, select a provider, expose inventory, reserve materials, price, charge, publish, or unlock Outcome.",
  };
}
