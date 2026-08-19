import { describe, expect, it } from "vitest";
import { canonicalTenantFixture } from "./test/canonicalFixtures";

describe("canonical non-production tenant fixture", () => {
  it("links organization, workspace, identity, workflow, notification, job, commercial, audit, and integration state by their canonical keys", () => {
    const fixture = canonicalTenantFixture;
    expect(fixture.workspace.organizationId).toBe(fixture.organization.id);
    expect(fixture.organization.ownerUserId).toBe(fixture.users.owner.id);
    expect(fixture.memberships).toEqual(expect.arrayContaining([
      expect.objectContaining({ workspaceId: fixture.workspace.id, userId: fixture.users.owner.id, role: "owner", status: "active" }),
      expect.objectContaining({ workspaceId: fixture.workspace.id, userId: fixture.users.collaborator.id, role: "member", status: "active" }),
    ]));
    expect(fixture.project.workspaceId).toBe(fixture.workspace.id);
    expect(fixture.asset.workspaceId).toBe(fixture.workspace.id);
    expect(fixture.asset.projectId).toBe(fixture.project.id);
    expect(fixture.invitation.workspaceId).toBe(fixture.workspace.id);
    expect(fixture.workflowEvent.workspaceId).toBe(fixture.workspace.id);
    expect(fixture.workflowEvent.projectId).toBe(fixture.project.id);
    expect(fixture.workflowEvent.assetId).toBe(fixture.asset.id);
    expect(fixture.reviewRequest.workspaceId).toBe(fixture.workspace.id);
    expect(fixture.reviewRequest.projectId).toBe(fixture.project.id);
    expect(fixture.reviewRequest.assetId).toBe(fixture.asset.id);
    expect(fixture.delivery.workspaceId).toBe(fixture.workspace.id);
    expect(fixture.delivery.projectId).toBe(fixture.project.id);
    expect(fixture.notification.workspaceId).toBe(fixture.workspace.id);
    expect(fixture.notification.recipientUserId).toBe(fixture.users.collaborator.id);
    expect(fixture.notificationPreference.userId).toBe(fixture.users.collaborator.id);
    expect(fixture.job.workspaceId).toBe(fixture.workspace.id);
    expect(fixture.entitlement.workspaceId).toBe(fixture.workspace.id);
    expect(fixture.entitlement.planId).toBe(fixture.plan.id);
    expect(fixture.featureFlag.workspaceId).toBe(fixture.workspace.id);
    expect(fixture.featureFlag.createdByUserId).toBe(fixture.users.owner.id);
    expect(fixture.auditLog.workspaceId).toBe(fixture.workspace.id);
    expect(fixture.auditLog.actorUserId).toBe(fixture.users.owner.id);
  });

  it("contains operational state only and no customer-generated review or testimonial fields", () => {
    const serialized = JSON.stringify(canonicalTenantFixture).toLowerCase();
    ["testimonial", "rating", "customer"].forEach(forbidden => expect(serialized).not.toContain(forbidden));
    expect(canonicalTenantFixture.reviewRequest.status).toBe("pending");
    expect(canonicalTenantFixture.job.status).toBe("queued");
    expect(canonicalTenantFixture.integrationControl.status).toBe("reviewed");
  });
});
