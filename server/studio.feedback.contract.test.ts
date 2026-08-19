import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const studioSource = readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Studio.tsx"), "utf8");
const feedbackSource = readFileSync(path.resolve(import.meta.dirname, "../client/src/components/StudioWorkflowFeedback.tsx"), "utf8");

describe("Studio workflow feedback contract", () => {
  it("exposes query retry controls and mutation error states", () => {
    ["spaces.error", "projects.error", "reviews.error", "deliveries.error", "transition.error", "requestReview.error", "respond.error", "createDelivery.error", "readyDelivery.error"].forEach(token => expect(studioSource).toContain(token));
    expect(feedbackSource).toContain("Retry");
    expect(feedbackSource).toContain('role="alert"');
  });

  it("reports successful project, review, and delivery workflow actions", () => {
    ["Project stage updated.", "Review request created.", "Review response recorded.", "Delivery record created.", "Delivery marked ready."].forEach(token => expect(studioSource).toContain(token));
    expect(feedbackSource).toContain('role="status"');
  });
});
