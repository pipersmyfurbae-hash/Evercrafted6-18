import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const indexSource = readFileSync(path.resolve(import.meta.dirname, "./_core/index.ts"), "utf8");
const jobsSource = readFileSync(path.resolve(import.meta.dirname, "./jobs.ts"), "utf8");
const dbSource = readFileSync(path.resolve(import.meta.dirname, "./db.ts"), "utf8");
const runLog = readFileSync(path.resolve(import.meta.dirname, "../docs/roadmap/RUN_LOG.md"), "utf8");

describe("scheduled job-recovery contract", () => {
  it("mounts a cron-authenticated recovery handler with machine-readable failures", () => {
    expect(indexSource).toContain('app.post("/api/scheduled/recover-jobs"');
    expect(indexSource).toContain("user.isCron || !user.taskUid");
    expect(indexSource).toContain("runScheduledJobRecovery()");
    expect(indexSource).toContain('context: { path: "/api/scheduled/recover-jobs" }');
  });

  it("requeues retryable stale jobs and fails exhausted jobs without heavy-media work", () => {
    expect(jobsSource).toContain("recoverStaleBackgroundJobs(staleBefore)");
    expect(jobsSource).toContain("claimQueuedBackgroundJobs(25)");
    expect(jobsSource).not.toMatch(/setInterval|node-cron|processor\.submit/i);
    expect(dbSource).toContain('status: "queued"');
    expect(dbSource).toContain('status: "running"');
    expect(dbSource).toContain('status: "failed"');
    expect(dbSource).toContain("Maximum recovery attempts reached");
    expect(dbSource).toContain("eq(backgroundJobs.attempts, job.attempts)");
  });

  it("records the deploy-before-schedule prerequisite and intentionally deferred Heartbeat cadence", () => {
    expect(runLog).toContain("Save and publish a checkpoint containing this handler before creating a Heartbeat task");
    expect(runLog).toContain("No project-level Heartbeat schedule is configured");
  });
});
