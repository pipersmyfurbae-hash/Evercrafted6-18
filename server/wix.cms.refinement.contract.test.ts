import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");

describe("Wix CMS refinement evidence", () => {
  const manifest = read("wix-config/evercrafted-cms-manifest.json");
  const preflight = read("docs/wix/WIX_CMS_REFINEMENT_PREFLIGHT.md");

  it("locks the complete zero-record preflight and administrator-only baseline", () => {
    expect(preflight).toContain("All 17 `evercrafted-*` collections returned `totalCount: 0`");
    expect(preflight).toContain("`ADMIN` insert, read, update, and remove permissions");
  });

  it("preserves reference and slug migrations as explicit Harmony deferrals after verified validation rejections", () => {
    expect(preflight).toContain("`WDE0080`: `REFERENCE` is not supported for this Harmony site");
    expect(preflight).toContain("`WDE0075: Slug metadata not provided for slug field`");
    expect(preflight).toContain("No reference conversion was applied");
    expect(preflight).toContain("No slug conversion was applied");
    expect(manifest).toContain("TEXT_PENDING_REFERENCE");
    expect(manifest).toContain("TEXT_PENDING_SLUG_METADATA");
  });

  it("forbids inferred payloads and permission relaxation while the configuration path remains unsupported", () => {
    expect(preflight).toContain("Do not infer an alternate `REFERENCE` payload or relax collection permissions");
    expect(preflight).toContain("Do not infer metadata or alter the established URL strategy");
  });
});
