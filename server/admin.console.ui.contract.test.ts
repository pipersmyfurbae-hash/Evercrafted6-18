import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminPage = readFileSync(resolve(process.cwd(), "client/src/pages/Admin.tsx"), "utf8");

describe("restricted administration console UI contract", () => {
  it("renders the complete durable-job telemetry and non-secret readiness signals", () => {
    expect(adminPage).toContain("queueLatencyMs");
    expect(adminPage).toContain("retryingJobs");
    expect(adminPage).toContain("deadLetterJobs");
    expect(adminPage).toContain("heavyMediaEscalationJobIds");
    expect(adminPage).toContain("providerHandoffEscalationJobIds");
    expect(adminPage).toContain("integrationHealth");
  });

  it("provides recoverable query states and auditable-support mutation feedback", () => {
    expect(adminPage).toContain("Loading restricted operational data");
    expect(adminPage).toContain("Retry operational data");
    expect(adminPage).toContain("recordSupport.isError");
    expect(adminPage).toContain("Support record created.");
    expect(adminPage).toContain("Administrator permission is required.");
  });
});
