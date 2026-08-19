/**
 * Deterministic, non-persisted canonical data used only by unit tests.
 * It intentionally contains no customer names, reviews, ratings, testimonials,
 * payment details, provider credentials, or production-like content.
 */
export const canonicalTenantFixture = Object.freeze({
  users: {
    owner: { id: 101, openId: "fixture-owner", role: "admin" as const },
    collaborator: { id: 102, openId: "fixture-collaborator", role: "user" as const },
  },
  organization: { id: 201, slug: "fixture-org", name: "Fixture organization", ownerUserId: 101 },
  workspace: { id: 301, organizationId: 201, slug: "fixture-workspace", name: "Fixture workspace", kind: "organization" as const },
  memberships: [
    { workspaceId: 301, userId: 101, role: "owner" as const, status: "active" as const },
    { workspaceId: 301, userId: 102, role: "member" as const, status: "active" as const },
  ],
  invitation: { id: 351, workspaceId: 301, email: "fixture-invite@example.invalid", role: "client" as const, tokenHash: "fixture-token-hash", status: "pending" as const },
  project: { id: 401, workspaceId: 301, name: "Fixture project", status: "active" as const, createdByUserId: 101 },
  asset: { id: 501, workspaceId: 301, projectId: 401, name: "fixture-asset", status: "active" as const },
  workflowEvent: { id: 551, workspaceId: 301, projectId: 401, assetId: 501, eventType: "project.status.changed", fromStatus: "draft", toStatus: "active", actorUserId: 101 },
  reviewRequest: { id: 561, workspaceId: 301, projectId: 401, assetId: 501, status: "pending" as const, requestedByUserId: 101, reviewerUserId: 102 },
  delivery: { id: 571, workspaceId: 301, projectId: 401, status: "ready" as const, destinationType: "provider_neutral", createdByUserId: 101 },
  notification: { id: 581, workspaceId: 301, recipientUserId: 102, type: "workflow.assigned", title: "Fixture workflow assignment", actionUrl: "/studio" },
  notificationPreference: { userId: 102, inAppEnabled: true, emailEnabled: false },
  job: { id: 601, workspaceId: 301, jobType: "fixture.processing", status: "queued" as const, attemptCount: 0 },
  plan: { id: 701, slug: "fixture-plan", name: "Fixture plan" },
  entitlement: { id: 801, workspaceId: 301, planId: 701, capability: "project.create", isEnabled: true, usageLimit: 3 },
  featureFlag: { id: 851, workspaceId: 301, key: "fixture.control", isEnabled: true, createdByUserId: 101 },
  auditLog: { id: 901, workspaceId: 301, actorUserId: 101, action: "fixture.project.created", targetType: "project", targetId: "401" },
  integrationControl: { integrationKey: "job_recovery" as const, status: "reviewed" as const, isEnabled: false },
});
