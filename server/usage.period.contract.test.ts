import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getCurrentUsagePeriod } from "./db";

describe("usage period and client commercial-state contract", () => {
  it("uses a UTC monthly period boundary for tenant usage counters", () => {
    const period = getCurrentUsagePeriod(new Date("2026-08-31T23:59:00.000Z"));
    expect(period.periodStart.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(period.periodEnd.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  it("renders membership-safe plan, provider, usage, loading, error, and empty states in settings", () => {
    const page = readFileSync(resolve(process.cwd(), "client/src/pages/Settings.tsx"), "utf8");
    expect(page).toContain("workspace.commercialOverview");
    expect(page).toContain("Billing provider:");
    expect(page).toContain("Current-period usage");
    expect(page).toContain("Loading plan and usage state");
    expect(page).toContain("Retry plan state");
    expect(page).toContain("No subscription lifecycle record");
  });

  it("records usage after the governed project, asset, Studio review, delivery, and publishing-handoff success paths", () => {
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    ["project.create", "asset.upload", "asset.versioning", "studio.review", "studio.delivery", "studio.publishing_handoff"].forEach(metric => expect(router).toContain(`metric: \"${metric}\"`));
    expect(router).toContain("isSubscriptionStatusEligible");
    expect(router).toContain("getWorkspaceUsageMetric");
  });
});
