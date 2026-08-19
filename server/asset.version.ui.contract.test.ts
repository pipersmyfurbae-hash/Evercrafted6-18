import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const studioSource = readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Studio.tsx"), "utf8");
const dbSource = readFileSync(path.resolve(import.meta.dirname, "./db.ts"), "utf8");

describe("asset current-version UI contract", () => {
  it("derives currentVersionNumber from ordered asset versions in the tenant-scoped asset list", () => {
    expect(dbSource).toContain("currentVersionNumber");
    expect(dbSource).toContain("orderBy(desc(assetVersions.versionNumber))");
  });

  it("renders the dynamic version number instead of an invented fixed revision label", () => {
    expect(studioSource).toContain("asset.currentVersionNumber");
    expect(studioSource).not.toContain(">v1</span>");
  });
});
