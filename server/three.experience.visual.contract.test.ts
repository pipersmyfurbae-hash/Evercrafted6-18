import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const readClientFile = (relativePath: string) => readFileSync(path.resolve(import.meta.dirname, `../client/src/${relativePath}`), "utf8");

describe("three-experience visual system", () => {
  const routes = readClientFile("App.tsx");
  const styles = readClientFile("index.css");
  const home = readClientFile("pages/Home.tsx");
  const editorial = readClientFile("pages/EvercraftedPages.tsx");
  const clientLanding = readClientFile("pages/ClientLanding.tsx");
  const clientLayout = readClientFile("components/DashboardLayout.tsx");
  const personal = readClientFile("pages/Personal.tsx");
  const personalLayout = readClientFile("components/PersonalLayout.tsx");

  it("registers separate public editorial, Client conversion/workspace, and owner-only Personal route groups", () => {
    ["/collections", "/journal", "/about", "/contact", "/client", "/client/how-it-works", "/client/capabilities", "/client/outcomes", "/client/access", "/client/sign-in", "/app", "/projects", "/studio", "/settings", "/personal", "/admin"].forEach(route => expect(routes).toContain(`path="${route}"`));
  });

  it("uses distinct named experience surfaces and the approved editorial typography without importing source-template visual language", () => {
    expect(styles).toContain(".evercrafted-surface");
    expect(styles).toContain(".client-surface");
    expect(styles).toContain(".personal-surface");
    expect(styles).toContain('font-family: "Newsreader"');
    expect(home).toContain("evercrafted-surface");
    expect(home).toContain("font-editorial");
    expect(editorial).toContain("evercrafted-surface");
    expect(clientLanding).toContain("client-surface");
    expect(personalLayout).toContain("personal-surface");
    [home, editorial, clientLanding, personal].forEach(source => expect(source.toLowerCase()).not.toContain("testimonial"));
  });

  it("keeps Client operational navigation and the private Personal frame structurally separate", () => {
    expect(clientLayout).toContain("Client workspace");
    expect(clientLayout).not.toContain('path: "/personal"');
    expect(personalLayout).toContain('aria-label="Personal navigation"');
    expect(personalLayout).not.toContain('href="/app"');
    expect(personal).toContain("commandCenterAccess");
  });
});
