import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");

describe("Wix live audit evidence", () => {
  const manifest = JSON.parse(read("wix-config/evercrafted-cms-manifest.json")) as { targetSiteId: string; collections: Array<{ id: string }> };
  const audit = read("docs/wix/WIX_LIVE_AUDIT.md");

  it("binds the audited target site to the versioned 17-collection intended manifest", () => {
    expect(manifest.targetSiteId).toBe("4a20e429-d686-4f4d-8282-13454219024a");
    expect(manifest.collections).toHaveLength(17);
    expect(audit).toContain(manifest.targetSiteId);
    expect(audit).toContain("**17** intended administrator-only collections");
  });

  it("records all 17 live collection IDs, complete paging metadata, and the administrator-only policy baseline", () => {
    manifest.collections.forEach(({ id }) => expect(audit).toContain(`\`${id}\``));
    expect(audit).toContain("`count: 17`, `offset: 0`, `total: 17`, and `tooManyToCount: false`");
    expect(audit).toContain("All **17** returned collections have `ADMIN` permissions");
    expect(audit).toContain("no CMS creation or restoration operation is required");
  });

  it("records the current Wix Forms automation scope without claiming an Evercrafted workflow", () => {
    expect(audit).toContain("exactly **three** active `APPLICATION` automations");
    ["New submission received for Mailing list 1", "New submission received for Contact Form", "New submission received for Mailing list"].forEach(name => expect(audit).toContain(`\`${name}\``));
    expect(audit).toContain("no `USER` origin automation");
    expect(audit).toContain("No Evercrafted operational automation was observed");
  });

  it("preserves explicitly deferred Velo/editor proof and the no-testimonial boundary", () => {
    expect(audit).toContain("does **not** prove Velo member/role/tenant policy");
    expect(audit).toContain("No template-provided reviews, ratings, testimonials");
  });
});
