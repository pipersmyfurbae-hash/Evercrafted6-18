import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..", "..");
const readProjectFile = (relativePath: string) => readFileSync(path.join(projectRoot, relativePath), "utf8");

type Manifest = {
  strategy: string;
  collections: Array<{ id: string; experienceVisibility: string[] }>;
  securityNotes: string[];
};

describe("Wix shared-engine contract", () => {
  const manifest = JSON.parse(readProjectFile("wix-config/evercrafted-cms-manifest.json")) as Manifest;

  it("keeps the pre-policy CMS baseline administrator-only", () => {
    expect(manifest.strategy).toBe("backend-admin-only-until-velo-policy-is-deployed");
    expect(manifest.securityNotes).toContain("All existing collection permissions remain administrator-only until Velo policy deployment and verification.");
  });

  it("declares the 17 shared-engine collection boundaries without duplicates", () => {
    const ids = manifest.collections.map((collection) => collection.id);
    expect(ids).toHaveLength(17);
    expect(new Set(ids).size).toBe(17);
    expect(ids).toEqual(expect.arrayContaining(["evercrafted-workspaces", "evercrafted-projects", "evercrafted-assets", "evercrafted-review-requests", "evercrafted-audit-events", "evercrafted-leads"]));
  });

  it("separates public lead capture from tenant workspace records", () => {
    const leads = manifest.collections.find((item) => item.id === "evercrafted-leads");
    const workspaces = manifest.collections.find((item) => item.id === "evercrafted-workspaces");
    expect(leads?.experienceVisibility).toContain("evercrafted-public-form");
    expect(leads?.experienceVisibility).toContain("client-saas-public-access-form");
    expect(workspaces?.experienceVisibility).not.toContain("evercrafted-public-form");
  });

  it("keeps Client SaaS and Personal Velo policies distinct", () => {
    const dashboard = readProjectFile("wix-velo/backend/evercraftedDashboard.web.js");
    const personal = readProjectFile("wix-velo/backend/evercraftedPersonal.web.js");
    expect(dashboard).toContain("Permissions.SiteMember");
    expect(dashboard).toContain("membershipFor(workspaceId)");
    expect(personal).toContain("EVERCRAFTED_PLATFORM_OWNER_MEMBER_ID");
    expect(personal).toContain("assertPlatformOwner()");
  });
});
