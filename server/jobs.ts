import { claimQueuedBackgroundJobs, getBackgroundJobHealth, isHeavyMediaJobType, recoverStaleBackgroundJobs } from "./db";

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

export type BackgroundJobServiceKind = "processing" | "notification" | "webhook" | "studio";

export type DurableJobServiceRequest = {
  jobId: number;
  workspaceId: number | null;
  jobType: string;
  idempotencyKey: string;
  payload: unknown;
};

export type DurableJobServiceResult =
  | { status: "accepted"; externalReference: string }
  | { status: "deferred"; reason: string }
  | { status: "rejected"; reason: string };

/**
 * A provider adapter is deliberately an interface, not an in-process worker.
 * The durable record is claimed by the recovery policy first; an approved
 * external worker/service can then consume the same request shape.
 */
export interface DurableJobServiceAdapter {
  readonly kind: BackgroundJobServiceKind;
  dispatch(request: DurableJobServiceRequest): Promise<DurableJobServiceResult>;
}

export function classifyBackgroundJobService(jobType: string): BackgroundJobServiceKind | null {
  if (jobType.startsWith("notification.")) return "notification";
  if (jobType.startsWith("webhook.")) return "webhook";
  if (jobType.startsWith("studio.") || isHeavyMediaJobType(jobType)) return "studio";
  if (jobType.startsWith("asset.") || jobType.startsWith("processing.")) return "processing";
  return null;
}

export function createDurableJobServiceDispatcher(adapters: Partial<Record<BackgroundJobServiceKind, DurableJobServiceAdapter>>) {
  return async (request: DurableJobServiceRequest): Promise<DurableJobServiceResult> => {
    const kind = classifyBackgroundJobService(request.jobType);
    if (!kind) return { status: "rejected", reason: `Unsupported durable job type: ${request.jobType}` };
    const adapter = adapters[kind];
    if (!adapter) return { status: "deferred", reason: `No approved ${kind} service adapter is configured` };
    return adapter.dispatch(request);
  };
}
