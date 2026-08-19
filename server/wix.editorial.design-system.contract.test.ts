import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");

describe("Wix editorial design-system specification", () => {
  const designSystem = read("docs/wix/WIX_EDITORIAL_DESIGN_SYSTEM.md");

  it("defines the approved neutral material tokens and high-contrast readability rule", () => {
    ["`#F6F3EE`", "`#E6E0D6`", "`#6B5A4A`", "`#23211F`", "`#50645B`"].forEach(token => expect(designSystem).toContain(token));
    expect(designSystem).toContain("at least 4.5:1");
  });

  it("preserves the three-experience separation and rejects template visual inheritance", () => {
    expect(designSystem).toContain("**not** a global platform theme");
    expect(designSystem).toContain("Client SaaS retains its clear operational system");
    expect(designSystem).toContain("Personal remains a private, dense command system");
    expect(designSystem).toContain("explicitly rejecting their colors, typography, promotional voice, and testimonial treatment");
  });

  it("forbids invented social proof and defers all live Wix mutation until a supported path exists", () => {
    expect(designSystem).toContain("No rating, star treatment, review, testimonial");
    expect(designSystem).toContain("no live page, theme, font, Store, CMS, Member, Velo, or content mutation");
    expect(designSystem).toContain("supported editor or page-management path");
  });
});
