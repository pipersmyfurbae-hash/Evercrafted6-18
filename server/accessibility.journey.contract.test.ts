import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const readClientFile = (relativePath: string) => readFileSync(path.resolve(import.meta.dirname, `../client/src/${relativePath}`), "utf8");

describe("journey-level accessibility contract", () => {
  it("keeps every public route keyboard-reachable through a skip link, named navigation, and main target", () => {
    const routeExpectations = [
      ["pages/Home.tsx", "Evercrafted navigation"],
      ["pages/EvercraftedPages.tsx", "Evercrafted navigation"],
      ["pages/ClientLanding.tsx", "Client SaaS navigation"],
      ["pages/Product.tsx", "Evercrafted product navigation"],
      ["pages/Pricing.tsx", "Evercrafted pricing navigation"],
      ["pages/NotFound.tsx", "Evercrafted fallback navigation"],
    ];
    routeExpectations.forEach(([file, landmark]) => {
      const source = readClientFile(file);
      expect(source).toContain("SkipLink");
      expect(source).toContain('id="main-content"');
      expect(source).toContain(landmark);
    });
  });

  it("provides explicit labels and status feedback in Client workspace, Studio, and administration controls", () => {
    const settings = readClientFile("pages/Settings.tsx");
    const admin = readClientFile("pages/Admin.tsx");
    const studioCreation = readClientFile("components/StudioProjectCreation.tsx");
    const studioFeedback = readClientFile("components/StudioWorkflowFeedback.tsx");
    expect(settings).toContain("Workspace capabilities");
    expect(settings).toContain("Retry plan state");
    expect(settings).toContain('aria-label="Workspace for invitation"');
    expect(settings).toContain('aria-label="Collaborator email"');
    expect(settings).toContain('aria-label="Invitation role"');
    expect(admin).toContain('aria-label="Workspace for restricted administration"');
    expect(admin).toContain('aria-label="Plan for subscription assignment"');
    expect(admin).toContain('role="alert"');
    expect(studioCreation).toContain('htmlFor="studio-project-name"');
    expect(studioFeedback).toContain('aria-live="polite"');
    expect(studioFeedback).toContain('role="status"');
  });

  it("retains Personal owner denial plus overview loading, retry, and form feedback states", () => {
    const personal = readClientFile("pages/Personal.tsx");
    ["Checking private access", "Loading private operations overview", "Retry private overview", "role=\"alert\"", "aria-live=\"polite\"", "Integration control note"].forEach(token => expect(personal).toContain(token));
  });

  it("keeps visible focus treatment and honors reduced-motion preferences globally", () => {
    const styles = readClientFile("index.css");
    expect(styles).toContain(":focus-visible");
    expect(styles).toContain("prefers-reduced-motion: reduce");
    expect(styles).toContain("transition-duration: 0.01ms");
  });
});
