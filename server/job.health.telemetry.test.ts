import { describe, expect, it } from "vitest";
import { summarizeBackgroundJobTelemetry } from "./db";

describe("background job telemetry", () => {
  it("calculates queue latency, retry/dead-letter counts, and provider-handoff escalation candidates", () => {
    const now = new Date("2026-08-19T12:00:00.000Z");
    const telemetry = summarizeBackgroundJobTelemetry([
      { id: 1, jobType: "studio.provider_handoff", status: "queued", attempts: 1, maxAttempts: 3, createdAt: new Date("2026-08-19T11:40:00.000Z"), updatedAt: new Date("2026-08-19T11:40:00.000Z"), startedAt: null, completedAt: null },
      { id: 2, jobType: "asset.thumbnail", status: "running", attempts: 2, maxAttempts: 3, createdAt: new Date("2026-08-19T11:55:00.000Z"), updatedAt: new Date("2026-08-19T11:57:00.000Z"), startedAt: new Date("2026-08-19T11:57:00.000Z"), completedAt: null },
      { id: 3, jobType: "studio.provider_handoff", status: "failed", attempts: 3, maxAttempts: 3, createdAt: new Date("2026-08-19T11:30:00.000Z"), updatedAt: new Date("2026-08-19T11:35:00.000Z"), startedAt: new Date("2026-08-19T11:31:00.000Z"), completedAt: new Date("2026-08-19T11:35:00.000Z") },
      { id: 4, jobType: "media.render", status: "queued", attempts: 0, maxAttempts: 3, createdAt: new Date("2026-08-19T11:41:00.000Z"), updatedAt: new Date("2026-08-19T11:41:00.000Z"), startedAt: null, completedAt: null },
    ], now);

    expect(telemetry.queueLatencyMs).toBe(20 * 60 * 1000);
    expect(telemetry.retryingJobs).toBe(2);
    expect(telemetry.deadLetterJobs).toBe(1);
    expect(telemetry.providerHandoffEscalationJobIds).toEqual([1, 3]);
    expect(telemetry.heavyMediaEscalationJobIds).toEqual([1, 3, 4]);
  });
});
