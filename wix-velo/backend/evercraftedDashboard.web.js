import { webMethod, Permissions } from "@wix/web-methods";
import { items } from "@wix/data";
import { members } from "@wix/members";

const COLLECTIONS = {
  workspaces: "evercrafted-workspaces",
  memberships: "evercrafted-workspace-memberships",
  projects: "evercrafted-projects",
  reviews: "evercrafted-review-requests",
  notifications: "evercrafted-notifications",
  deliveries: "evercrafted-deliveries",
};

const ACTIVE_MEMBERSHIP = "active";

async function currentMemberId() {
  const member = await members.getCurrentMember();
  if (!member?._id) {
    throw new Error("An authenticated site member is required.");
  }
  return member._id;
}

async function membershipFor(workspaceId) {
  if (!workspaceId) throw new Error("A workspace ID is required.");

  const memberId = await currentMemberId();
  const result = await items
    .query(COLLECTIONS.memberships)
    .eq("workspaceId", workspaceId)
    .eq("memberId", memberId)
    .eq("status", ACTIVE_MEMBERSHIP)
    .limit(1)
    .find();

  const membership = result.items?.[0];
  if (!membership) {
    throw new Error("You are not an active member of this workspace.");
  }
  return { memberId, membership };
}

function assertRole(role, allowedRoles) {
  if (!allowedRoles.includes(role)) {
    throw new Error("Your workspace role cannot perform this action.");
  }
}

export const listMyWorkspaces = webMethod(
  Permissions.SiteMember,
  async () => {
    const memberId = await currentMemberId();
    const membershipResult = await items
      .query(COLLECTIONS.memberships)
      .eq("memberId", memberId)
      .eq("status", ACTIVE_MEMBERSHIP)
      .limit(100)
      .find();

    const memberships = membershipResult.items ?? [];
    const workspaceResults = await Promise.all(
      memberships.map(async (membership) => {
        const workspaceResult = await items
          .query(COLLECTIONS.workspaces)
          .eq("_id", membership.workspaceId)
          .limit(1)
          .find();
        const workspace = workspaceResult.items?.[0];
        return workspace
          ? {
              id: workspace._id,
              name: workspace.name,
              kind: workspace.kind,
              isArchived: workspace.isArchived,
              role: membership.role,
            }
          : null;
      }),
    );

    return workspaceResults.filter(Boolean);
  },
);

export const getWorkspaceOverview = webMethod(
  Permissions.SiteMember,
  async (workspaceId) => {
    const { memberId, membership } = await membershipFor(workspaceId);
    const [workspaceResult, projectsResult, reviewsResult, notificationsResult] =
      await Promise.all([
        items.query(COLLECTIONS.workspaces).eq("_id", workspaceId).limit(1).find(),
        items.query(COLLECTIONS.projects).eq("workspaceId", workspaceId).limit(12).find(),
        items
          .query(COLLECTIONS.reviews)
          .eq("workspaceId", workspaceId)
          .eq("status", "pending")
          .limit(12)
          .find(),
        items
          .query(COLLECTIONS.notifications)
          .eq("memberId", memberId)
          .eq("workspaceId", workspaceId)
          .limit(12)
          .find(),
      ]);

    const workspace = workspaceResult.items?.[0];
    if (!workspace || workspace.isArchived) {
      throw new Error("The requested workspace is unavailable.");
    }

    return {
      workspace: {
        id: workspace._id,
        name: workspace.name,
        kind: workspace.kind,
        role: membership.role,
      },
      projects: projectsResult.items ?? [],
      pendingReviews: reviewsResult.items ?? [],
      notifications: notificationsResult.items ?? [],
    };
  },
);

export const getWorkspaceOperations = webMethod(
  Permissions.SiteMember,
  async (workspaceId) => {
    const { membership } = await membershipFor(workspaceId);
    assertRole(membership.role, ["owner", "admin"]);

    const [membershipResult, deliveryResult] = await Promise.all([
      items
        .query(COLLECTIONS.memberships)
        .eq("workspaceId", workspaceId)
        .eq("status", ACTIVE_MEMBERSHIP)
        .limit(100)
        .find(),
      items
        .query(COLLECTIONS.deliveries)
        .eq("workspaceId", workspaceId)
        .limit(50)
        .find(),
    ]);

    return {
      members: membershipResult.items ?? [],
      deliveries: deliveryResult.items ?? [],
    };
  },
);
