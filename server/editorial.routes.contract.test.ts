import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(path.resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");
const pagesSource = readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/EvercraftedPages.tsx"), "utf8");

describe("Evercrafted editorial route contract", () => {
  it("registers separate editorial collection, journal, account, legal, and 404 routes", () => {
    ["/collections/material-studies", "/journal/the-patience-of-material", "/account", "/sign-in", "/privacy", "/terms", "/404"].forEach((route) => {
      expect(appSource).toContain(`path="${route}"`);
    });
  });

  it("keeps unverified catalogue availability and customer-claim content out of public editorial copy", () => {
    expect(pagesSource).toContain("only from verified commerce records");
    expect(pagesSource).not.toMatch(/testimonial|customer review|five-star|rating/i);
  });
});
