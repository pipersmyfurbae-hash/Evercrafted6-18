import { describe, expect, it } from "vitest";
import { getQueuedJobClaimTransition } from "./db";

describe("queued job recovery transition", () => {
  it("claims a queued retryable job once and does not claim the resulting running state again", () => {
    const first = getQueuedJobClaimTransition({ status: "queued", attempts: 0, maxAttempts: 3 });
    expect(first).toEqual({ status: "running", attempts: 1 });
    expect(getQueuedJobClaimTransition({ status: first?.status ?? "queued", attempts: first?.attempts ?? 0, maxAttempts: 3 })).toBeUndefined();
  });

  it("allows a recovered retryable job to advance once more but fails an exhausted queued job", () => {
    expect(getQueuedJobClaimTransition({ status: "queued", attempts: 1, maxAttempts: 3 })).toEqual({ status: "running", attempts: 2 });
    expect(getQueuedJobClaimTransition({ status: "queued", attempts: 3, maxAttempts: 3 })).toEqual({ status: "failed", attempts: 3 });
  });
});
