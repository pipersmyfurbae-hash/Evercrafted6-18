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
  createDelivery,
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
  getWorkspaceMembership,
  listAssetsForProject,
  listAssetVersionsForWorkspace,
  listBackgroundJobsForWorkspace,
  listDeliveries,
  listNotificationsForUser,
  listPlatformFeatureFlags,
  listPlatformWorkspaces,
  listPlans,
  listProjectsForWorkspace,
  listReviewRequests,
  listRecentSupportAudits,
  listRecentPlatformActivity,
  listWorkspaceEntitlements,
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
  updateWorkspaceMemberRole,
  type WorkspaceRole,
  writeAuditLog,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
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
        return createProject({ ...input, createdByUserId: ctx.user.id });
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
        if (input.projectId && !await getProjectForWorkspace(input.projectId, input.workspaceId)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found in this workspace" });
        }
        const bytes = Buffer.from(input.base64, "base64");
        if (bytes.byteLength === 0 || bytes.byteLength > 5 * 1024 * 1024) {
          throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Uploads must be between 1 byte and 5 MiB" });
        }
        const safeFileName = input.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const storageResult = await storagePut(`workspaces/${input.workspaceId}/assets/${safeFileName}`, bytes, input.mediaType);
        return registerAsset({
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
        const asset = await getAssetForWorkspace(input.assetId, input.workspaceId);
        if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found in this workspace" });
        const bytes = Buffer.from(input.base64, "base64");
        if (bytes.byteLength === 0 || bytes.byteLength > 5 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Uploads must be between 1 byte and 5 MiB" });
        const safeFileName = input.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const storageResult = await storagePut(`workspaces/${input.workspaceId}/assets/${input.assetId}/revisions/${Date.now()}-${safeFileName}`, bytes, input.mediaType);
        const result = await createAssetVersion({ workspaceId: input.workspaceId, assetId: input.assetId, storageKey: storageResult.key, sizeBytes: bytes.byteLength, checksum: input.checksum, metadata: { url: storageResult.url }, createdByUserId: ctx.user.id });
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found in this workspace" });
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
        if (!await getProjectForWorkspace(input.projectId, input.workspaceId)) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found in this workspace" });
        if (input.assetId && !await getAssetForWorkspace(input.assetId, input.workspaceId)) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found in this workspace" });
        return createReviewRequest({ ...input, requestedByUserId: ctx.user.id });
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
        if (!await getProjectForWorkspace(input.projectId, input.workspaceId)) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found in this workspace" });
        return createDelivery({ ...input, createdByUserId: ctx.user.id });
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
        const handoff = await queueDeliveryPublishingHandoff({ ...input, actorUserId: ctx.user.id });
        if (handoff.outcome === "not_found") throw new TRPCError({ code: "NOT_FOUND", message: "Delivery not found in this workspace" });
        if (handoff.outcome === "not_ready") throw new TRPCError({ code: "BAD_REQUEST", message: "Delivery must be ready before it can be handed off" });
        return { delivery: handoff.delivery, job: handoff.job };
      }),
  }),
  notification: router({
    listMine: protectedProcedure.query(async ({ ctx }) => listNotificationsForUser(ctx.user.id)),
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
    listEntitlements: adminProcedure
      .input(z.object({ workspaceId: z.number().int().positive() }))
      .query(async ({ input }) => listWorkspaceEntitlements(input.workspaceId)),
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
      const [workspaces, activity, jobHealth] = await Promise.all([listPlatformWorkspaces(), listRecentPlatformActivity(), getBackgroundJobHealth()]);
      await writeAuditLog({ actorUserId: owner.id, action: "personal.command_center.overview_viewed", targetType: "command_center" });
      return { workspaceCount: workspaces.length, recentWorkspaces: workspaces.slice(0, 8), recentActivity: activity.slice(0, 12), jobHealth };
    }),
  }),
});

export type AppRouter = typeof appRouter;
