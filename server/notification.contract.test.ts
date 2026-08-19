import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dbSource = readFileSync(path.resolve(import.meta.dirname, "./db.ts"), "utf8");
const routerSource = readFileSync(path.resolve(import.meta.dirname, "./routers.ts"), "utf8");
const pageSource = readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Notifications.tsx"), "utf8");

describe("notification delivery contract", () => {
  it("creates an in-app notification when a workspace reviewer is assigned", () => {
    expect(dbSource).toContain('type: "studio.review_requested"');
    expect(dbSource).toContain("recipientUserId: input.reviewerUserId");
    expect(dbSource).toContain('actionUrl: "/studio"');
  });

  it("creates a persisted-preference-gated job notification only for the authorized publishing-handoff initiator", () => {
    expect(dbSource).toContain('type: "job.studio_provider_handoff.queued"');
    expect(dbSource).toContain("recipientUserId: input.actorUserId");
    expect(dbSource).toContain("createNotification({");
  });

  it("keeps in-app delivery preference-ready and renders recoverable notification states", () => {
    expect(routerSource).toContain("preferenceStatus");
    expect(routerSource).toContain("getNotificationPreferences(ctx.user.id)");
    expect(routerSource).toContain("updateNotificationPreferences");
    expect(dbSource).toContain("isInAppDeliveryEnabled(preferences)");
    expect(dbSource).toContain("selectWorkspaceNotificationRecipientIds");
    expect(pageSource).toContain("notifications.error");
    expect(pageSource).toContain("notifications.refetch");
    expect(pageSource).toContain("notification.actionUrl");
  });
});
