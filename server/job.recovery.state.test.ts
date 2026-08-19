import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({ recoverStaleBackgroundJobs: vi.fn(), claimQueuedBackgroundJobs: vi.fn(), getBackgroundJobHealth: vi.fn() }));
vi.mock("./db", () => repositoryMocks);
import { runScheduledJobRecovery } from "./jobs";

describe("scheduled job recovery state machine", () => {
  beforeEach(() => vi.clearAllMocks());

  it("combines stale recovery, atomic queued claims, and health without executing a provider", async () => {
    repositoryMocks.recoverStaleBackgroundJobs.mockResolvedValue({ requeued: 2, failed: 1 });
    repositoryMocks.claimQueuedBackgroundJobs.mockResolvedValue({ claimed: 2, exhausted: 1, jobIds: [7, 8] });
    repositoryMocks.getBackgroundJobHealth.mockResolvedValue({ counts: { running: 2 }, oldestQueuedAt: null });
    await expect(runScheduledJobRecovery()).resolves.toMatchObject({ requeued: 2, failed: 1, claimed: 2, exhausted: 1, claimedJobIds: [7, 8], health: { counts: { running: 2 } } });
    expect(repositoryMocks.recoverStaleBackgroundJobs).toHaveBeenCalledTimes(1);
    expect(repositoryMocks.claimQueuedBackgroundJobs).toHaveBeenCalledWith(25);
  });
});
