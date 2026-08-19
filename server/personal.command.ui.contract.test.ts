import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const personalPage = readFileSync(resolve(process.cwd(), "client/src/pages/Personal.tsx"), "utf8");

describe("Personal command UI contract", () => {
  it("provides private-project creation with owner-visible loading, error, and success states", () => {
    expect(personalPage).toContain("trpc.personal.createPrivateProject.useMutation");
    expect(personalPage).toContain("Create private project");
    expect(personalPage).toContain("createPrivateProject.isPending");
    expect(personalPage).toContain("createPrivateProject.isError");
    expect(personalPage).toContain("Private project created.");
  });

  it("retains explicit exact-owner access and non-secret operational indicators", () => {
    expect(personalPage).toContain("Checking private access");
    expect(personalPage).toContain("configured platform owner");
    expect(personalPage).toContain("Integration controls");
    expect(personalPage).toContain("heavy-media cases need attention");
    expect(personalPage).toContain("trpc.personal.updateIntegrationControl.useMutation");
    expect(personalPage).toContain("Save integration control");
    expect(personalPage).toContain("Integration control saved.");
    expect(personalPage).toContain("Record non-secret enablement intent");
    expect(personalPage).toContain("Retry private overview");
    expect(personalPage).toContain("No recent workspace records are available.");
  });
});
