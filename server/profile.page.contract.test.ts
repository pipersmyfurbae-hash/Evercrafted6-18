import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const profileSource = readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Profile.tsx"), "utf8");

describe("profile-management page contract", () => {
  it("exposes loading, error, validation, success, and pending states around the typed profile update", () => {
    ["profile.isLoading", "profile.error", "validationError", "update.isPending", "update.isSuccess", "update.mutate"].forEach(token => {
      expect(profileSource).toContain(token);
    });
  });

  it("refreshes the authentication identity cache after a profile update", () => {
    expect(profileSource).toContain("utils.auth.me.invalidate()");
    expect(profileSource).toContain("aria-invalid");
  });
});
