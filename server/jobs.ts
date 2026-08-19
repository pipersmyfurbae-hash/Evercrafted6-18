import { claimQueuedBackgroundJobs, getBackgroundJobHealth, recoverStaleBackgroundJobs } from "./db";

/**
 * Recovery is intentionally small and idempotent: it never performs a heavy
 * media operation in the HTTP handler. Dedicated media providers or a later
 * persistent worker can consume the same durable job records.
 */
export async function runScheduledJobRecovery() {
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000);
  const recovery = await recoverStaleBackgroundJobs(staleBefore);
  const claims = await claimQueuedBackgroundJobs(25);
  const health = await getBackgroundJobHealth();
  return { ...recovery, ...claims, claimedJobIds: claims.jobIds, health, recoveredAt: new Date().toISOString() };
}

export type HeavyMediaJobRequest = {
  jobId: number;
  workspaceId: number;
  operation: string;
  assetId?: number;
};

/**
 * Provider-neutral boundary for a future dedicated media processor. The core
 * SaaS records and authorizes work first; a provider adapter will be selected
 * only after its cost, data handling, and capability review is approved.
 */
export interface HeavyMediaProcessor {
  submit(request: HeavyMediaJobRequest): Promise<{ externalJobId: string }>;
}
