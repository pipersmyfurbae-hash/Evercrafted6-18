import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const readClientFile = (relativePath: string) =>
  readFileSync(path.resolve(import.meta.dirname, `../client/src/${relativePath}`), "utf8");

describe("three-experience navigation contract", () => {
  const clientLayout = readClientFile("components/DashboardLayout.tsx");
  const personalLayout = readClientFile("components/PersonalLayout.tsx");
  const personalPage = readClientFile("pages/Personal.tsx");

  it("keeps Personal out of Client workspace navigation", () => {
    expect(clientLayout).toContain("Client workspace");
    expect(clientLayout).not.toContain('{ icon: UserRound, label: "Personal", path: "/personal" }');
  });

  it("keeps Client workspace navigation out of the Personal layout", () => {
    expect(personalLayout).toContain("aria-label=\"Personal navigation\"");
    expect(personalLayout).not.toContain("Return to Client workspace");
    expect(personalLayout).not.toContain('href="/app"');
  });

  it("uses the explicit owner-only Personal access contract and denial state", () => {
    expect(personalPage).toContain("trpc.personal.commandCenterAccess.useQuery()");
    expect(personalPage).toContain("trpc.personal.overview.useQuery");
    expect(personalPage).toContain("Client workspace ownership does not grant access");
  });
});
