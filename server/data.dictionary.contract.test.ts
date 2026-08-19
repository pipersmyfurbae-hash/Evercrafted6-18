import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dictionary = readFileSync(path.resolve(import.meta.dirname, "../docs/architecture/DATA_DICTIONARY.md"), "utf8");

describe("canonical data dictionary", () => {
  it("documents every persisted canonical entity family and current migration state", () => {
    ["users", "organizations", "workspaces", "workspaceMemberships", "workspaceInvitations", "projects", "assets", "assetVersions", "workflowEvents", "reviewRequests", "deliveries", "notifications", "notificationPreferences", "backgroundJobs", "plans", "workspaceSubscriptions", "workspaceUsage", "workspaceEntitlements", "featureFlags", "platformIntegrationControls", "auditLogs", "leads"].forEach(entity => expect(dictionary).toContain(`\`${entity}\``));
    expect(dictionary).toContain("Verified against `drizzle/schema.ts`");
    expect(dictionary).toContain("`0003_messy_gambit`");
  });
});
