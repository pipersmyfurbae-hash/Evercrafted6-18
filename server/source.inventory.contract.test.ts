import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");

describe("managed and preserved source inventory", () => {
  const inventory = read("docs/architecture/SOURCE_INVENTORY.md");
  const managedRoutes = read("client/src/App.tsx");
  const legacyApp = read("moodoor-studio-src/src/App.tsx");
  const legacyStorage = read("moodoor-studio-src/src/lib/storage.ts");
  const legacyModelClient = read("moodoor-studio-src/src/lib/claude.ts");

  it("records the managed runtime as the source of truth and the preserved Moodoor source as reference-only", () => {
    expect(inventory).toContain("**Active implementation source of truth**");
    expect(inventory).toContain("**Reference-only port source");
    expect(inventory).toContain("not imported or executed by the managed runtime");
    expect(managedRoutes).toContain('path="/studio"');
    expect(managedRoutes).not.toContain("moodoor-studio-src");
  });

  it("records and guards the legacy direct-key, local-storage, and hash-routing boundaries", () => {
    expect(legacyApp).toContain("window.location.hash");
    expect(legacyStorage).toContain("localStorage");
    expect(legacyModelClient).toContain("dangerouslyAllowBrowser: true");
    expect(inventory).toContain("Never expose an operator key to the browser");
    expect(inventory).toContain("Use managed application route groups");
  });
});
