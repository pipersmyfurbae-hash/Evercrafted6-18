import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(path.resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");
const clientSource = readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/ClientLanding.tsx"), "utf8");

describe("Client SaaS sign-in route contract", () => {
  it("registers a dedicated Client sign-in route", () => {
    expect(appSource).toContain('path="/client/sign-in"');
  });

  it("keeps Client sign-in operational and separate from the editorial account path", () => {
    expect(clientSource).toContain('"/client/sign-in"');
    expect(clientSource).toContain("Continue securely");
    expect(clientSource).toContain('href="/client/sign-in"');
    expect(clientSource).not.toContain('href="/account"');
  });
});
