import { webMethod, Permissions } from "@wix/web-methods";
import { members } from "@wix/members";
import { items } from "@wix/data";
import { secrets } from "@wix/secrets";
import { auth } from "@wix/essentials";

const PLATFORM_OWNER_SECRET = "EVERCRAFTED_PLATFORM_OWNER_MEMBER_ID";

const COLLECTIONS = {
  workspaces: "evercrafted-workspaces",
  projects: "evercrafted-projects",
  auditEvents: "evercrafted-audit-events",
  jobs: "evercrafted-background-jobs",
  integrations: "evercrafted-integration-connections",
};

async function currentMemberId() {
  const member = await members.getCurrentMember();
  if (!member?._id) {
    throw new Error("An authenticated site member is required.");
  }
  return member._id;
}

async function assertPlatformOwner() {
  const memberId = await currentMemberId();
  const getSecretValue = auth.elevate(secrets.getSecretValue);
  const { value: ownerMemberId } = await getSecretValue(PLATFORM_OWNER_SECRET);

  if (!ownerMemberId || memberId !== ownerMemberId) {
    throw new Error("The Personal command experience is restricted to the platform owner.");
  }
  return memberId;
}

export const getPersonalOverview = webMethod(
  Permissions.SiteMember,
  async () => {
    await assertPlatformOwner();
    const [workspacesResult, projectsResult, jobsResult, integrationsResult] =
      await Promise.all([
        items.query(COLLECTIONS.workspaces).limit(100).find(),
        items.query(COLLECTIONS.projects).limit(20).find(),
        items.query(COLLECTIONS.jobs).limit(50).find(),
        items.query(COLLECTIONS.integrations).limit(50).find(),
      ]);

    return {
      workspaces: workspacesResult.items ?? [],
      recentProjects: projectsResult.items ?? [],
      jobs: jobsResult.items ?? [],
      integrations: integrationsResult.items ?? [],
    };
  },
);

export const getPersonalAuditTrail = webMethod(
  Permissions.SiteMember,
  async () => {
    await assertPlatformOwner();
    const auditResult = await items
      .query(COLLECTIONS.auditEvents)
      .descending("createdAt")
      .limit(100)
      .find();
    return auditResult.items ?? [];
  },
);
