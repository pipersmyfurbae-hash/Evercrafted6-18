import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const readClientFile = (relativePath: string) => readFileSync(path.resolve(import.meta.dirname, `../client/src/${relativePath}`), "utf8");

describe("implemented experience accessibility contract", () => {
  it("provides a shared keyboard skip-navigation mechanism with a visible focus state", () => {
    const skipLink = readClientFile("components/SkipLink.tsx");
    const styles = readClientFile("index.css");
    expect(skipLink).toContain("Skip to main content");
    expect(skipLink).toContain("focus:translate-y-0");
    expect(styles).toContain(":focus-visible");
  });

  it("attaches skip links and main targets to the four implemented experience shells", () => {
    ["pages/Home.tsx", "pages/ClientLanding.tsx", "pages/EvercraftedPages.tsx", "components/DashboardLayout.tsx", "components/PersonalLayout.tsx"].forEach(file => {
      const source = readClientFile(file);
      expect(source).toContain("SkipLink");
      expect(source).toContain("main-content");
    });
  });
});
