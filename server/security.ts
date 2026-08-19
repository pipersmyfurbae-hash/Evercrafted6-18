import { TRPCError } from "@trpc/server";
import {
  getProjectForWorkspace,
  getWorkspaceMembership,
  getWorkspaceUsageMetric,
  isSubscriptionStatusEligible,
  isWorkspaceCapabilityEnabled,
  listWorkspaceEntitlements,
  listWorkspaceSubscriptions,
  type WorkspaceRole,
} from "./db";

export type WorkspaceOperationInput = {
  userId: number;
  workspaceId: number;
  predicate?: (role: WorkspaceRole) => boolean;
  projectId?: number;
  capability?: string;
};

/**
 * Central protected-operation boundary. Call this before any workspace-scoped
 * read or side effect that receives a workspace and optional project identifier.
 */
export async function authorizeWorkspaceOperation(input: WorkspaceOperationInput) {
  const membership = await getWorkspaceMembership(input.userId, input.workspaceId);
  if (!membership || membership.status !== "active" || membership.workspaceArchived || (input.predicate && !input.predicate(membership.role))) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to access this workspace action" });
  }

  const project = input.projectId === undefined ? undefined : await getProjectForWorkspace(input.projectId, input.workspaceId);
  if (input.projectId !== undefined && !project) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Project not found in this workspace" });
  }

  if (input.capability) {
    const entitlements = await listWorkspaceEntitlements(input.workspaceId);
    const explicitEntitlement = entitlements.find(entitlement => entitlement.capability === input.capability);
    if (!isWorkspaceCapabilityEnabled(entitlements, input.capability)) {
      throw new TRPCError({ code: "FORBIDDEN", message: `The ${input.capability} capability is not enabled for this workspace` });
    }
    const subscriptions = await listWorkspaceSubscriptions(input.workspaceId);
    if (!isSubscriptionStatusEligible(subscriptions[0]?.status)) {
      throw new TRPCError({ code: "FORBIDDEN", message: `The current subscription status does not allow ${input.capability}` });
    }
    if (explicitEntitlement?.usageLimit !== null && explicitEntitlement?.usageLimit !== undefined) {
      const usage = await getWorkspaceUsageMetric(input.workspaceId, input.capability);
      if ((usage?.quantity ?? 0) >= explicitEntitlement.usageLimit) {
        throw new TRPCError({ code: "FORBIDDEN", message: "The current-period usage limit has been reached for this workspace operation" });
      }
    }
  }

  return { membership, project };
}
