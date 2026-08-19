import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");

describe("Wix migration decision record", () => {
  const manifest = JSON.parse(read("wix-config/evercrafted-cms-manifest.json")) as {
    targetSiteId: string;
    collections: Array<{ id: string }>;
  };
  const decision = read("docs/wix/WIX_MIGRATION_DECISION_RECORD.md");

  it("retains the managed engine as the authoritative runtime while binding the Wix target and manifest", () => {
    expect(decision).toContain(manifest.targetSiteId);
    expect(decision).toContain("managed Evercrafted application remains the governed source of truth and primary runtime");
    manifest.collections.forEach(({ id }) => expect(decision).toContain(`\`${id}\``));
  });

  it("keeps Client membership and Personal owner policy as distinct server-side Velo gates", () => {
    expect(decision).toContain("active `evercrafted-workspace-memberships` record");
    expect(decision).toContain("`EVERCRAFTED_PLATFORM_OWNER_MEMBER_ID`");
    expect(decision).toContain("Workspace ownership alone must be denied");
    expect(decision).toContain("never be placed in CMS, frontend code, or repository history");
  });

  it("does not conflate Store commerce or Wix Forms notifications with SaaS access or durable operational work", () => {
    expect(decision).toContain("must not grant Client SaaS workspace membership");
    expect(decision).toContain("or reuse generic form notifications as tenant workflow automation");
    expect(decision).toContain("do not replace idempotent job claims");
  });

  it("preserves the required no-testimonial and no-live-mutation boundaries", () => {
    expect(decision).toContain("No invented user-generated content");
    expect(decision).toContain("no Wix implementation mutation authorized by this record");
    expect(decision).not.toMatch(/customer testimonial|five-star|5-star/i);
  });
});
