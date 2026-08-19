import { describe, expect, it, vi } from "vitest";
import { classifyBackgroundJobService, createDurableJobServiceDispatcher, type DurableJobServiceRequest } from "./jobs";

const fixtureRequest: DurableJobServiceRequest = { jobId: 1, workspaceId: 7, jobType: "studio.provider_handoff", idempotencyKey: "fixture-key", payload: { projectId: 3 } };

describe("provider-neutral durable job service contracts", () => {
  it("classifies processing, notification, webhook retry, and Studio job families without introducing a worker runtime", () => {
    expect(classifyBackgroundJobService("asset.thumbnail")).toBe("processing");
    expect(classifyBackgroundJobService("notification.deliver")).toBe("notification");
    expect(classifyBackgroundJobService("webhook.retry")).toBe("webhook");
    expect(classifyBackgroundJobService("studio.provider_handoff")).toBe("studio");
    expect(classifyBackgroundJobService("unknown.work")).toBeNull();
  });

  it("defers unconfigured provider execution, dispatches only an approved matching adapter, and rejects unknown work", async () => {
    const studioDispatch = vi.fn().mockResolvedValue({ status: "accepted", externalReference: "approved-provider-job" });
    const dispatchWithoutAdapters = createDurableJobServiceDispatcher({});
    await expect(dispatchWithoutAdapters(fixtureRequest)).resolves.toEqual({ status: "deferred", reason: "No approved studio service adapter is configured" });

    const dispatch = createDurableJobServiceDispatcher({ studio: { kind: "studio", dispatch: studioDispatch } });
    await expect(dispatch(fixtureRequest)).resolves.toEqual({ status: "accepted", externalReference: "approved-provider-job" });
    expect(studioDispatch).toHaveBeenCalledWith(fixtureRequest);
    await expect(dispatch({ ...fixtureRequest, jobType: "unknown.work" })).resolves.toEqual({ status: "rejected", reason: "Unsupported durable job type: unknown.work" });
  });
});
