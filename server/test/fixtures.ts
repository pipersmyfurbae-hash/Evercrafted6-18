import type { WorkspaceRole } from "../db";

export const tenantFixture = {
  ownerUserId: 101,
  memberUserId: 102,
  outsiderUserId: 103,
  workspaceId: 201,
  otherWorkspaceId: 202,
  projectId: 301,
} as const;

export function membershipFixture(role: WorkspaceRole, workspaceId = tenantFixture.workspaceId) {
  return {
    workspaceId,
    userId: tenantFixture.memberUserId,
    role,
    status: "active" as const,
  };
}
