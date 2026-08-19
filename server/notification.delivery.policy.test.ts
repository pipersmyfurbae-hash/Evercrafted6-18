import { describe, expect, it } from "vitest";
import { buildProviderHandoffNotification, createInAppNotificationCandidate } from "./db";

describe("provider handoff notification delivery policy", () => {
  it("creates an in-app handoff notification only for the authorized initiator when persisted in-app delivery is enabled", () => {
    expect(buildProviderHandoffNotification({ workspaceId: 8, actorUserId: 21 }, { inAppEnabled: true })).toMatchObject({ workspaceId: 8, recipientUserId: 21, type: "job.studio_provider_handoff.queued", actionUrl: "/studio" });
  });

  it("suppresses job-event delivery when the persisted in-app preference is disabled", () => {
    expect(buildProviderHandoffNotification({ workspaceId: 8, actorUserId: 21 }, { inAppEnabled: false })).toBeUndefined();
    expect(createInAppNotificationCandidate({ recipientUserId: 21, type: "test", title: "Test" }, { inAppEnabled: false })).toBeUndefined();
  });
});
