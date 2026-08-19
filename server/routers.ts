import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import {
  canAdministerWorkspace,
  canManageWorkspace,
  acceptWorkspaceInvitation,
  captureLead,
  createPlan,
  assignWorkspaceSubscription,
  createDelivery,
  getNotificationPreferences,
  createOrganizationWorkspace,
  createProject,
  createReviewRequest,
  createWorkspaceInvitation,
  enqueueBackgroundJob,
  createAssetVersion,
  queueDeliveryPublishingHandoff,
  ensurePersonalWorkspace,
  getProjectForWorkspace,
  getAssetForWorkspace,
  getBackgroundJobHealth,
  getWorkspaceCommercialOverview,
  getWorkspaceUsageMetric,
  getWorkspaceMembership,
  isWorkspaceCapabilityEnabled,
  isSubscriptionStatusEligible,
  incrementWorkspaceUsage,
  listAssetsForProject,
  listAssetVersionsForWorkspace,
  listBackgroundJobsForWorkspace,
  listDeliveries,
  listNotificationsForUser,
  notifyWorkspaceMembers,
  listPlatformFeatureFlags,
  listPlatformIntegrationControls,
  listPlatformWorkspaces,
  listPlans,
  listProjectsForWorkspace,
  listReviewRequests,
  listRecentSupportAudits,
  listRecentPlatformActivity,
  listWorkspaceEntitlements,
  listWorkspaceSubscriptions,
  listWorkspaceInvitations,
  listWorkspaceMembers,
  listWorkspacesForUser,
  markNotificationRead,
  markDeliveryReady,
  registerAsset,
  respondToReviewRequest,
  searchProjectsForUser,
  setWorkspaceEntitlement,
  setWorkspaceFeatureFlag,
  transitionProjectStatus,
  updateUserProfile,
  updateNotificationPreferences,
  updatePlatformIntegrationControl,
  updateWorkspaceMemberRole,
  type WorkspaceRole,
  writeAuditLog,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { createSourceGroundedDraft } from "./guidedWreath";
import { canOpenGuidedWreath, decideGuidedArtifact, getGuidedProjectForWorkspace, getGuidedWreathJourney, saveGroundedDraft, saveGuidedMemory, startGuidedWreathProject } from "./guidedWreathDb";
import { generateGuidedFlorals, getGuidedFlorals, selectGuidedFloralCandidate } from "./guidedFloralsDb";
import { generateGuidedWreathBlueprint, getGuidedRecipeBlueprint, lockGuidedWreathRecipe } from "./guidedRecipesDb";
import { storageGetSignedUrl, storagePut } from "./storage";
import { adminProcedure, ownerProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const workspaceRoleSchema = z.enum(["owner", "admin", "member", "viewer", "client"]);

async function requireWorkspaceRole(input: {
  userId: number;
  workspaceId: number;
  predicate: (role: WorkspaceRole) => boolean;
}) {
  const membership = await getWorkspaceMembership(input.userId, input.workspaceId);
  if (!membership || membership.status !== "active" || membership.workspaceArchived || !input.predicate(membership.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to access this workspace action" });
  }
  return membership;
}

async function requireWorkspaceCapability(workspaceId: number, capability: string) {
  const entitlements = await listWorkspaceEntitlements(workspaceId);
  const explicitEntitlement = entitlements.find(entitlement => entitlement.capability === capability);
  if (!isWorkspaceCapabilityEnabled(entitlements, capability)) {
    throw new TRPCError({ code: "FORBIDDEN", message: `The ${capability} capability is not enabled for this workspace` });
  }
  const subscriptions = await listWorkspaceSubscriptions(workspaceId);
  const currentSubscription = subscriptions[0];
  if (!isSubscriptionStatusEligible(currentSubscription?.status)) {
    throw new TRPCError({ code: "FORBIDDEN", message: `The current subscription status does not allow ${capability}` });
  }
  if (explicitEntitlement?.usageLimit !== null && explicitEntitlement?.usageLimit !== undefined) {
    const usage = await getWorkspaceUsageMetric(workspaceId, capability);
    if ((usage?.quantity ?? 0) >= explicitEntitlement.usageLimit) {
      throw new TRPCError({ code: "FORBIDDEN", message: `The current-period usage limit has been reached for ${capability}` });
    }
  }
  return { capability, source: explicitEntitlement ? "explicit" as const : "default" as const, usageLimit: explicitEntitlement?.usageLimit ?? null };
}

export const appRouter = router({
  system: systemRouter,
  lead: router({
    capture: publicProcedure
      .input(z.object({ email: z.string().email().max(320), name: z.string().trim().max(160).optional(), interest: z.string().trim().max(120).optional() }))
      .mutation(async ({ input }) => {
        await captureLead({ ...input, source: "evercrafted_marketing" });
        return { accepted: true };
      }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  profile: router({
    me: protectedProcedure.query(async ({ ctx }) => ctx.user),
    update: protectedProcedure
      .input(z.object({ name: z.string().trim().min(1).max(160), email: z.string().email().max(320).optional() }))
      .mutation(async ({ ctx, input }) => {
        const user = await updateUserProfile({ userId: ctx.user.id, ...input });
        await writeAuditLog({ actorUserId: ctx.user.id, action: "profile.updated", targetType: "user", targetId: String(ctx.user.id) });
        return user;
      }),
  }),
  workspace: router({
    bootstrap: protectedProcedure.mutation(async ({ ctx }) => {
      const personalWorkspace = await ensurePersonalWorkspace(ctx.user);
      const availableWorkspaces = await listWorkspacesForUser(ctx.user.id);
      return { personalWorkspace, availableWorkspaces };
    }),
    listMine: protectedProcedure.query(async ({ ctx }) => {
      await ensurePersonalWorkspace(ctx.user);
      return listWorkspacesForUser(ctx.user.id);
    }),
    createOrganization: protectedProcedure
      .input(z.object({ organizationName: z.string().trim().min(2).max(160), workspaceName: z.string().trim().min(2).max(160).optional() }))
      .mutation(async ({ ctx, input }) => createOrganizationWorkspace({ ownerUserId: ctx.user.id, ...input })),
    invite: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), email: z.string().email().max(320), role: workspaceRoleSchema.exclude(["owner"]) }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canAdministerWorkspace });
        return createWorkspaceInvitation({ ...input, invitedByUserId: ctx.user.id });
      }),
    listInvitations: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canAdministerWorkspace });
        return listWorkspaceInvitations(input.workspaceId);
      }),
    listMembers: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: () => true });
        return listWorkspaceMembers(input.workspaceId);
      }),
    acceptInvitation: protectedProcedure
      .input(z.object({ token: z.string().min(20).max(128) }))
      .mutation(async ({ ctx, input }) => acceptWorkspaceInvitation({ token: input.token, user: ctx.user })),
    updateMemberRole: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), userId: z.number().int().positive(), role: workspaceRoleSchema.exclude(["owner"]) }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canAdministerWorkspace });
        const membership = await updateWorkspaceMemberRole({ ...input, actorUserId: ctx.user.id });
        if (!membership) throw new TRPCError({ code: "NOT_FOUND", message: "Workspace membership not found" });
        return membership;
      }),
    membership: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: () => true })),
    canManage: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const membership = await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canManageWorkspace });
        return { allowed: true, role: membership.role };
      }),
    canAdminister: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const membership = await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canAdministerWorkspace });
        return { allowed: true, role: membership.role };
      }),
    entitlements: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: () => true });
        return listWorkspaceEntitlements(input.workspaceId);
      }),
    commercialOverview: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: () => true });
        return getWorkspaceCommercialOverview(input.workspaceId);
      }),
  }),
  project: router({
    list: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: () => true });
        return listProjectsForWorkspace(input.workspaceId);
      }),
    get: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: () => true });
        const project = await getProjectForWorkspace(input.projectId, input.workspaceId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found in this workspace" });
        return project;
      }),
    create: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), name: z.string().trim().min(2).max(180), description: z.string().trim().max(4000).optional() }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canManageWorkspace });
        await requireWorkspaceCapability(input.workspaceId, "project.create");
        const project = await createProject({ ...input, createdByUserId: ctx.user.id });
        await incrementWorkspaceUsage({ workspaceId: input.workspaceId, metric: "project.create" });
        return project;
      }),
  }),
  guidedWreath: router({
    start: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), name: z.string().trim().min(2).max(180) }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canOpenGuidedWreath });
        return startGuidedWreathProject({ ...input, createdByUserId: ctx.user.id });
      }),
    journey: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: () => true });
        const project = await getGuidedProjectForWorkspace(input.projectId, input.workspaceId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Guided Wreath project not found in this workspace" });
        return { project, ...(await getGuidedWreathJourney(project.id)), florals: await getGuidedFlorals(project.id), recipe: await getGuidedRecipeBlueprint(project.id) };
      }),
    saveMemory: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive(), body: z.string().trim().min(20).max(8000), visibility: z.enum(["private", "private_story_shareable_wreath", "private_link_lookbook", "anonymous_gallery", "public_first_name", "fully_public"]).default("private") }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canOpenGuidedWreath });
        const project = await getGuidedProjectForWorkspace(input.projectId, input.workspaceId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Guided Wreath project not found in this workspace" });
        return saveGuidedMemory({ ...input, createdByUserId: ctx.user.id });
      }),
    generateDraft: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canOpenGuidedWreath });
        const project = await getGuidedProjectForWorkspace(input.projectId, input.workspaceId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Guided Wreath project not found in this workspace" });
        const journey = await getGuidedWreathJourney(project.id);
        if (!journey.memory) throw new TRPCError({ code: "BAD_REQUEST", message: "Save a memory before creating Your Essence." });
        const generated = await createSourceGroundedDraft(journey.memory.body);
        return saveGroundedDraft({ workspaceId: input.workspaceId, projectId: project.id, memoryEntryId: journey.memory.id, createdByUserId: ctx.user.id, ...generated });
      }),
    decide: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive(), stage: z.enum(["essence", "story"]), entityId: z.number().int().positive(), decision: z.enum(["approved", "revision_requested"]), note: z.string().trim().max(2000).optional() }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canOpenGuidedWreath });
        const project = await getGuidedProjectForWorkspace(input.projectId, input.workspaceId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Guided Wreath project not found in this workspace" });
        const result = await decideGuidedArtifact({ ...input, decidedByUserId: ctx.user.id });
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Guided Wreath artifact not found in this project" });
        return result;
      }),
    generateFlorals: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canOpenGuidedWreath });
        await requireWorkspaceCapability(input.workspaceId, "guided_wreath.florals");
        const project = await getGuidedProjectForWorkspace(input.projectId, input.workspaceId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Guided Wreath project not found in this workspace" });
        try {
          return await generateGuidedFlorals({ ...input, createdByUserId: ctx.user.id });
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Guided Florals could not be opened" });
        }
      }),
    selectFloral: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive(), roleSetId: z.number().int().positive(), candidateId: z.number().int().positive(), selectionRationale: z.string().trim().max(1000).optional() }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canOpenGuidedWreath });
        await requireWorkspaceCapability(input.workspaceId, "guided_wreath.florals");
        const project = await getGuidedProjectForWorkspace(input.projectId, input.workspaceId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Guided Wreath project not found in this workspace" });
        try {
          return await selectGuidedFloralCandidate({ ...input, selectedByUserId: ctx.user.id });
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Floral selection could not be saved" });
        }
      }),
    lockRecipe: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canOpenGuidedWreath });
        await requireWorkspaceCapability(input.workspaceId, "guided_wreath.recipe");
        const project = await getGuidedProjectForWorkspace(input.projectId, input.workspaceId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Guided Wreath project not found in this workspace" });
        try {
          return await lockGuidedWreathRecipe({ ...input, lockedByUserId: ctx.user.id });
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Recipe could not be locked" });
        }
      }),
    generateBlueprint: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canOpenGuidedWreath });
        await requireWorkspaceCapability(input.workspaceId, "guided_wreath.blueprint");
        const project = await getGuidedProjectForWorkspace(input.projectId, input.workspaceId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Guided Wreath project not found in this workspace" });
        try {
          return await generateGuidedWreathBlueprint({ ...input, createdByUserId: ctx.user.id });
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Simplified Blueprint could not be created" });
        }
      }),
  }),
  asset: router({
    list: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive().optional() }))
      .query(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: () => true });
        if (input.projectId && !await getProjectForWorkspace(input.projectId, input.workspaceId)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found in this workspace" });
        }
        return listAssetsForProject(input);
      }),
    downloadUrl: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), assetId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: () => true });
        const asset = await getAssetForWorkspace(input.assetId, input.workspaceId);
        if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found in this workspace" });
        await writeAuditLog({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, action: "asset.download_url.requested", targetType: "asset", targetId: String(input.assetId) });
        return { url: await storageGetSignedUrl(asset.storageKey), name: asset.name };
      }),
    uploadBase64: protectedProcedure
      .input(z.object({
        workspaceId: z.number().int().positive(),
        projectId: z.number().int().positive().optional(),
        name: z.string().trim().min(1).max(255),
        mediaType: z.string().trim().min(3).max(128),
        base64: z.string().min(1).max(7_000_000),
        checksum: z.string().trim().max(128).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canManageWorkspace });
        await requireWorkspaceCapability(input.workspaceId, "asset.upload");
        if (input.projectId && !await getProjectForWorkspace(input.projectId, input.workspaceId)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found in this workspace" });
        }
        const bytes = Buffer.from(input.base64, "base64");
        if (bytes.byteLength === 0 || bytes.byteLength > 5 * 1024 * 1024) {
          throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Uploads must be between 1 byte and 5 MiB" });
        }
        const safeFileName = input.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const storageResult = await storagePut(`workspaces/${input.workspaceId}/assets/${safeFileName}`, bytes, input.mediaType);
        const asset = await registerAsset({
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          name: input.name,
          mediaType: input.mediaType,
          storageKey: storageResult.key,
          sizeBytes: bytes.byteLength,
          checksum: input.checksum,
          metadata: { url: storageResult.url },
          createdByUserId: ctx.user.id,
        });
        await incrementWorkspaceUsage({ workspaceId: input.workspaceId, metric: "asset.upload" });
        return asset;
      }),
    versionHistory: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), assetId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: () => true });
        const history = await listAssetVersionsForWorkspace(input);
        if (!history) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found in this workspace" });
        return history;
      }),
    uploadVersionBase64: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), assetId: z.number().int().positive(), name: z.string().trim().min(1).max(255), mediaType: z.string().trim().min(3).max(128), base64: z.string().min(1).max(7_000_000), checksum: z.string().trim().max(128).optional() }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canManageWorkspace });
        await requireWorkspaceCapability(input.workspaceId, "asset.versioning");
        const asset = await getAssetForWorkspace(input.assetId, input.workspaceId);
        if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found in this workspace" });
        const bytes = Buffer.from(input.base64, "base64");
        if (bytes.byteLength === 0 || bytes.byteLength > 5 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Uploads must be between 1 byte and 5 MiB" });
        const safeFileName = input.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const storageResult = await storagePut(`workspaces/${input.workspaceId}/assets/${input.assetId}/revisions/${Date.now()}-${safeFileName}`, bytes, input.mediaType);
        const result = await createAssetVersion({ workspaceId: input.workspaceId, assetId: input.assetId, storageKey: storageResult.key, sizeBytes: bytes.byteLength, checksum: input.checksum, metadata: { url: storageResult.url }, createdByUserId: ctx.user.id });
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found in this workspace" });
        await incrementWorkspaceUsage({ workspaceId: input.workspaceId, metric: "asset.versioning" });
        return result;
      }),
  }),
  studio: router({
    transitionProject: protectedProcedure
      .input(z.object({
        workspaceId: z.number().int().positive(),
        projectId: z.number().int().positive(),
        toStatus: z.enum(["draft", "active", "in_review", "approved", "delivered", "archived"]),
        note: z.string().trim().max(2000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canManageWorkspace });
        const project = await transitionProjectStatus({ ...input, actorUserId: ctx.user.id });
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found in this workspace" });
        if (project) await notifyWorkspaceMembers({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, type: "project.status_changed", title: "Project stage updated", body: `Project is now ${input.toStatus.replace("_", " ")}.`, actionUrl: "/studio" });
        return project;
      }),
    listReviews: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: () => true });
        if (!await getProjectForWorkspace(input.projectId, input.workspaceId)) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found in this workspace" });
        return listReviewRequests(input);
      }),
    requestReview: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive(), assetId: z.number().int().positive().optional(), requestNote: z.string().trim().max(2000).optional(), reviewerUserId: z.number().int().positive().optional() }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canManageWorkspace });
        await requireWorkspaceCapability(input.workspaceId, "studio.review");
        if (!await getProjectForWorkspace(input.projectId, input.workspaceId)) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found in this workspace" });
        if (input.assetId && !await getAssetForWorkspace(input.assetId, input.workspaceId)) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found in this workspace" });
        const review = await createReviewRequest({ ...input, requestedByUserId: ctx.user.id });
        await incrementWorkspaceUsage({ workspaceId: input.workspaceId, metric: "studio.review" });
        return review;
      }),
    respondToReview: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), reviewId: z.number().int().positive(), status: z.enum(["approved", "changes_requested"]), responseNote: z.string().trim().max(2000).optional() }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: role => role !== "viewer" });
        const review = await respondToReviewRequest({ ...input, respondedByUserId: ctx.user.id });
        if (!review) throw new TRPCError({ code: "NOT_FOUND", message: "Review request not found in this workspace" });
        return review;
      }),
    listDeliveries: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: () => true });
        if (!await getProjectForWorkspace(input.projectId, input.workspaceId)) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found in this workspace" });
        return listDeliveries(input);
      }),
    createDelivery: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), projectId: z.number().int().positive(), destinationType: z.string().trim().min(2).max(80), destinationRef: z.string().trim().max(512).optional() }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canManageWorkspace });
        await requireWorkspaceCapability(input.workspaceId, "studio.delivery");
        if (!await getProjectForWorkspace(input.projectId, input.workspaceId)) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found in this workspace" });
        const delivery = await createDelivery({ ...input, createdByUserId: ctx.user.id });
        await incrementWorkspaceUsage({ workspaceId: input.workspaceId, metric: "studio.delivery" });
        return delivery;
      }),
    markDeliveryReady: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), deliveryId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canManageWorkspace });
        const delivery = await markDeliveryReady({ ...input, actorUserId: ctx.user.id });
        if (!delivery) throw new TRPCError({ code: "NOT_FOUND", message: "Delivery not found in this workspace" });
        return delivery;
      }),
    queuePublishingHandoff: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), deliveryId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canManageWorkspace });
        await requireWorkspaceCapability(input.workspaceId, "studio.publishing_handoff");
        const handoff = await queueDeliveryPublishingHandoff({ ...input, actorUserId: ctx.user.id });
        if (handoff.outcome === "not_found") throw new TRPCError({ code: "NOT_FOUND", message: "Delivery not found in this workspace" });
        if (handoff.outcome === "not_ready") throw new TRPCError({ code: "BAD_REQUEST", message: "Delivery must be ready before it can be handed off" });
        await incrementWorkspaceUsage({ workspaceId: input.workspaceId, metric: "studio.publishing_handoff" });
        return { delivery: handoff.delivery, job: handoff.job };
      }),
  }),
  notification: router({
    listMine: protectedProcedure.query(async ({ ctx }) => listNotificationsForUser(ctx.user.id)),
    preferenceStatus: protectedProcedure.query(async ({ ctx }) => getNotificationPreferences(ctx.user.id)),
    updatePreferences: protectedProcedure
      .input(z.object({ inAppEnabled: z.boolean(), emailEnabled: z.boolean() }))
      .mutation(async ({ ctx, input }) => updateNotificationPreferences({ userId: ctx.user.id, ...input })),
    markRead: protectedProcedure
      .input(z.object({ notificationId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await markNotificationRead({ notificationId: input.notificationId, userId: ctx.user.id });
        return { success: true };
      }),
  }),
  search: router({
    projects: protectedProcedure
      .input(z.object({ query: z.string().trim().min(2).max(120) }))
      .query(async ({ ctx, input }) => searchProjectsForUser({ userId: ctx.user.id, query: input.query })),
  }),
  job: router({
    list: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canAdministerWorkspace });
        return listBackgroundJobsForWorkspace(input.workspaceId);
      }),
    queue: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), jobType: z.string().trim().min(3).max(100), payload: z.record(z.string(), z.unknown()).optional() }))
      .mutation(async ({ ctx, input }) => {
        await requireWorkspaceRole({ userId: ctx.user.id, workspaceId: input.workspaceId, predicate: canAdministerWorkspace });
        const job = await enqueueBackgroundJob({
          ...input,
          idempotencyKey: `${input.workspaceId}:${input.jobType}:${nanoid(12)}`,
        });
        await writeAuditLog({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, action: "job.queued", targetType: "background_job", targetId: String(job?.id ?? "") });
        return job;
      }),
    health: adminProcedure.query(async () => getBackgroundJobHealth()),
  }),
  admin: router({
    listWorkspaces: adminProcedure.query(async () => listPlatformWorkspaces()),
    integrationHealth: adminProcedure.query(() => [
      { key: "publishing", label: "Publishing provider", status: "unconfigured" as const, detail: "No external publishing provider is enabled." },
      { key: "email", label: "External email", status: "unconfigured" as const, detail: "In-app delivery remains the active notification channel." },
      { key: "recovery", label: "Job recovery", status: "ready" as const, detail: "Cron-authenticated recovery endpoint is deployed; cadence remains deferred." },
    ]),
    listFeatureFlags: adminProcedure.query(async () => listPlatformFeatureFlags()),
    setFeatureFlag: adminProcedure
      .input(z.object({ key: z.string().trim().min(2).max(120), workspaceId: z.number().int().positive().optional(), isEnabled: z.boolean(), description: z.string().trim().max(2000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const flag = await setWorkspaceFeatureFlag({ ...input, createdByUserId: ctx.user!.id });
        await writeAuditLog({ workspaceId: input.workspaceId ?? null, actorUserId: ctx.user!.id, action: "admin.feature_flag.updated", targetType: "feature_flag", targetId: String(flag?.id ?? ""), metadata: { key: input.key, isEnabled: input.isEnabled } });
        return flag;
      }),
    listPlans: adminProcedure.query(async () => listPlans()),
    createPlan: adminProcedure
      .input(z.object({ slug: z.string().trim().regex(/^[a-z0-9-]+$/).min(2).max(80), name: z.string().trim().min(2).max(160), description: z.string().trim().max(4000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const plan = await createPlan(input);
        await writeAuditLog({ actorUserId: ctx.user!.id, action: "admin.plan.created", targetType: "plan", targetId: String(plan?.id ?? ""), metadata: { slug: input.slug } });
        return plan;
      }),
    assignWorkspaceSubscription: adminProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), planId: z.number().int().positive(), status: z.enum(["trialing", "active", "past_due", "paused", "canceled", "expired"]), currentPeriodEnd: z.date().optional() }))
      .mutation(async ({ ctx, input }) => {
        const subscription = await assignWorkspaceSubscription(input);
        await writeAuditLog({ workspaceId: input.workspaceId, actorUserId: ctx.user!.id, action: "admin.subscription.assigned", targetType: "workspace_subscription", targetId: String(subscription?.id ?? ""), metadata: { planId: input.planId, status: input.status } });
        return subscription;
      }),
    listEntitlements: adminProcedure
      .input(z.object({ workspaceId: z.number().int().positive() }))
      .query(async ({ input }) => listWorkspaceEntitlements(input.workspaceId)),
    listWorkspaceSubscriptions: adminProcedure
      .input(z.object({ workspaceId: z.number().int().positive() }))
      .query(async ({ input }) => listWorkspaceSubscriptions(input.workspaceId)),
    setEntitlement: adminProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), planId: z.number().int().positive().optional(), capability: z.string().trim().min(2).max(120), isEnabled: z.boolean(), usageLimit: z.number().int().nonnegative().optional() }))
      .mutation(async ({ ctx, input }) => {
        const entitlement = await setWorkspaceEntitlement(input);
        await writeAuditLog({ workspaceId: input.workspaceId, actorUserId: ctx.user!.id, action: "admin.entitlement.updated", targetType: "workspace_entitlement", targetId: String(entitlement?.id ?? ""), metadata: { capability: input.capability, isEnabled: input.isEnabled } });
        return entitlement;
      }),
    recentSupportAudits: adminProcedure.query(async () => listRecentSupportAudits()),
    recordSupportAccess: adminProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), reason: z.string().trim().min(10).max(1000) }))
      .mutation(async ({ ctx, input }) => {
        await writeAuditLog({
          workspaceId: input.workspaceId,
          actorUserId: ctx.user!.id,
          action: "support.access.requested",
          targetType: "workspace",
          targetId: String(input.workspaceId),
          metadata: { reason: input.reason },
        });
        return { recorded: true };
      }),
  }),
  personal: router({
    commandCenterAccess: ownerProcedure.query(async ({ ctx }) => {
      const owner = ctx.user;
      if (!owner) throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication is required" });
      await writeAuditLog({ actorUserId: owner.id, action: "personal.command_center.accessed", targetType: "command_center" });
      return { allowed: true, ownerUserId: owner.id };
    }),
    overview: ownerProcedure.query(async ({ ctx }) => {
      const owner = ctx.user;
      if (!owner) throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication is required" });
      const personalWorkspace = await ensurePersonalWorkspace(owner);
      const [workspaces, activity, jobHealth, privateProjects, integrationReadiness] = await Promise.all([listPlatformWorkspaces(), listRecentPlatformActivity(), getBackgroundJobHealth(), listProjectsForWorkspace(personalWorkspace.id), listPlatformIntegrationControls()]);
      await writeAuditLog({ actorUserId: owner.id, action: "personal.command_center.overview_viewed", targetType: "command_center" });
      return {
        workspaceCount: workspaces.length,
        personalWorkspace: { id: personalWorkspace.id, name: personalWorkspace.name, slug: personalWorkspace.slug },
        privateProjects: privateProjects.slice(0, 8),
        recentWorkspaces: workspaces.slice(0, 8),
        recentActivity: activity.slice(0, 12),
        jobHealth,
        integrationReadiness,
      };
    }),
    createPrivateProject: ownerProcedure
      .input(z.object({ name: z.string().trim().min(2).max(180), description: z.string().trim().max(4000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const owner = ctx.user;
        if (!owner) throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication is required" });
        const personalWorkspace = await ensurePersonalWorkspace(owner);
        await requireWorkspaceCapability(personalWorkspace.id, "project.create");
        const project = await createProject({ ...input, workspaceId: personalWorkspace.id, createdByUserId: owner.id });
        await incrementWorkspaceUsage({ workspaceId: personalWorkspace.id, metric: "project.create" });
        await writeAuditLog({ workspaceId: personalWorkspace.id, actorUserId: owner.id, action: "personal.project.created", targetType: "project", targetId: String(project?.id ?? "") });
        return project;
      }),
    recordIntegrationReview: ownerProcedure
      .input(z.object({ integrationKey: z.enum(["publishing_provider", "external_email", "job_recovery"]), note: z.string().trim().min(10).max(1000) }))
      .mutation(async ({ ctx, input }) => {
        const owner = ctx.user;
        if (!owner) throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication is required" });
        await writeAuditLog({ actorUserId: owner.id, action: "personal.integration.reviewed", targetType: "integration", targetId: input.integrationKey, metadata: { note: input.note } });
        return { integrationKey: input.integrationKey, recorded: true };
      }),
    updateIntegrationControl: ownerProcedure
      .input(z.object({ integrationKey: z.enum(["publishing_provider", "external_email", "job_recovery"]), status: z.enum(["unconfigured", "reviewed", "ready", "disabled"]), isEnabled: z.boolean(), reviewNote: z.string().trim().min(10).max(1000) }))
      .mutation(async ({ ctx, input }) => {
        const owner = ctx.user;
        if (!owner) throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication is required" });
        const control = await updatePlatformIntegrationControl({ ...input, reviewedByUserId: owner.id });
        await writeAuditLog({ actorUserId: owner.id, action: "personal.integration.control_updated", targetType: "integration", targetId: input.integrationKey, metadata: { status: input.status, isEnabled: input.isEnabled, reviewNote: input.reviewNote } });
        return control;
      }),
  }),
});

export type AppRouter = typeof appRouter;
