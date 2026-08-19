import { and, asc, desc, eq, inArray, like, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import {
  assetVersions,
  assets,
  auditLogs,
  backgroundJobs,
  featureFlags,
  InsertUser,
  leads,
  notifications,
  notificationPreferences,
  organizations,
  plans,
  projects,
  deliveries,
  reviewRequests,
  users,
  workflowEvents,
  workspaces,
  workspaceInvitations,
  workspaceMemberships,
  workspaceEntitlements,
  type User,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer" | "client";

const workspaceRoleRank: Record<WorkspaceRole, number> = {
  owner: 5,
  admin: 4,
  member: 3,
  client: 2,
  viewer: 1,
};

export function canManageWorkspace(role: WorkspaceRole) {
  return workspaceRoleRank[role] >= workspaceRoleRank.member;
}

export function canAdministerWorkspace(role: WorkspaceRole) {
  return workspaceRoleRank[role] >= workspaceRoleRank.admin;
}

function normalizeSlug(value: string, fallback: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 105);
  return normalized || fallback;
}

function requireDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("Database is unavailable");
  return db;
}

// Lazily create the Drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserProfile(input: { userId: number; name: string; email?: string | null }) {
  const db = requireDb(await getDb());
  await db.update(users).set({ name: input.name.trim(), email: input.email?.trim() || null }).where(eq(users.id, input.userId));
  const result = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
  return result[0];
}

export async function captureLead(input: { email: string; name?: string | null; interest?: string | null; source?: string }) {
  const db = requireDb(await getDb());
  await db.insert(leads).values({
    email: input.email.toLowerCase().trim(),
    name: input.name?.trim() || null,
    interest: input.interest?.trim() || null,
    source: input.source ?? "website",
  }).onDuplicateKeyUpdate({
    set: {
      name: input.name?.trim() || null,
      interest: input.interest?.trim() || null,
      source: input.source ?? "website",
      updatedAt: new Date(),
    },
  });
}

export async function getWorkspaceMembership(userId: number, workspaceId: number) {
  const db = requireDb(await getDb());
  const result = await db
    .select({
      workspaceId: workspaces.id,
      workspaceSlug: workspaces.slug,
      workspaceName: workspaces.name,
      workspaceKind: workspaces.kind,
      workspaceArchived: workspaces.isArchived,
      membershipId: workspaceMemberships.id,
      role: workspaceMemberships.role,
      status: workspaceMemberships.status,
    })
    .from(workspaceMemberships)
    .innerJoin(workspaces, eq(workspaceMemberships.workspaceId, workspaces.id))
    .where(and(eq(workspaceMemberships.userId, userId), eq(workspaceMemberships.workspaceId, workspaceId)))
    .limit(1);
  return result[0];
}

export async function listWorkspacesForUser(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select({
      id: workspaces.id,
      slug: workspaces.slug,
      name: workspaces.name,
      kind: workspaces.kind,
      organizationId: workspaces.organizationId,
      role: workspaceMemberships.role,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
    })
    .from(workspaceMemberships)
    .innerJoin(workspaces, eq(workspaceMemberships.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaceMemberships.userId, userId),
        eq(workspaceMemberships.status, "active"),
        eq(workspaces.isArchived, false),
      ),
    )
    .orderBy(asc(workspaces.kind), asc(workspaces.name));
}

export async function listWorkspaceMembers(workspaceId: number) {
  const db = requireDb(await getDb());
  return db.select({
    userId: users.id,
    name: users.name,
    email: users.email,
    role: workspaceMemberships.role,
    membershipId: workspaceMemberships.id,
  })
    .from(workspaceMemberships)
    .innerJoin(users, eq(workspaceMemberships.userId, users.id))
    .where(and(eq(workspaceMemberships.workspaceId, workspaceId), eq(workspaceMemberships.status, "active")))
    .orderBy(asc(users.name));
}

export async function ensurePersonalWorkspace(user: User) {
  const db = requireDb(await getDb());
  const existing = await db
    .select({ id: workspaces.id, slug: workspaces.slug, name: workspaces.name, kind: workspaces.kind })
    .from(workspaceMemberships)
    .innerJoin(workspaces, eq(workspaceMemberships.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaceMemberships.userId, user.id),
        eq(workspaceMemberships.status, "active"),
        eq(workspaceMemberships.role, "owner"),
        eq(workspaces.kind, "personal"),
      ),
    )
    .limit(1);

  if (existing[0]) return existing[0];

  const personalName = user.name?.trim() ? `${user.name.trim()}'s space` : "My personal space";
  const personalSlug = `me-${user.id}`;

  await db.insert(workspaces).values({
    slug: personalSlug,
    name: personalName,
    kind: "personal",
    createdByUserId: user.id,
  }).onDuplicateKeyUpdate({ set: { name: personalName } });

  const created = await db.select({ id: workspaces.id, slug: workspaces.slug, name: workspaces.name, kind: workspaces.kind })
    .from(workspaces)
    .where(eq(workspaces.slug, personalSlug))
    .limit(1);
  const workspace = created[0];
  if (!workspace) throw new Error("Personal workspace could not be created");

  await db.insert(workspaceMemberships).values({
    workspaceId: workspace.id,
    userId: user.id,
    role: "owner",
    status: "active",
  }).onDuplicateKeyUpdate({ set: { role: "owner", status: "active" } });

  await writeAuditLog({
    workspaceId: workspace.id,
    actorUserId: user.id,
    action: "workspace.personal.provisioned",
    targetType: "workspace",
    targetId: String(workspace.id),
  });

  return workspace;
}

export async function createOrganizationWorkspace(input: { ownerUserId: number; organizationName: string; workspaceName?: string }) {
  const db = requireDb(await getDb());
  const baseSlug = normalizeSlug(input.organizationName, "organization");
  const suffix = nanoid(6).toLowerCase();
  const organizationSlug = `${baseSlug}-${suffix}`;
  const workspaceName = input.workspaceName?.trim() || input.organizationName.trim();

  return db.transaction(async tx => {
    const [organizationResult] = await tx.insert(organizations).values({
      name: input.organizationName.trim(),
      slug: organizationSlug,
      ownerUserId: input.ownerUserId,
    }).$returningId();
    const organizationId = organizationResult?.id;
    if (!organizationId) throw new Error("Organization could not be created");

    const [workspaceResult] = await tx.insert(workspaces).values({
      name: workspaceName,
      slug: organizationSlug,
      kind: "organization",
      organizationId,
      createdByUserId: input.ownerUserId,
    }).$returningId();
    const workspaceId = workspaceResult?.id;
    if (!workspaceId) throw new Error("Organization workspace could not be created");

    await tx.insert(workspaceMemberships).values({
      workspaceId,
      userId: input.ownerUserId,
      role: "owner",
      status: "active",
    });

    await tx.insert(auditLogs).values({
      workspaceId,
      actorUserId: input.ownerUserId,
      action: "workspace.organization.created",
      targetType: "organization",
      targetId: String(organizationId),
      metadata: { organizationSlug },
    });

    return { organizationId, workspaceId, slug: organizationSlug, name: workspaceName };
  });
}

export async function createWorkspaceInvitation(input: { workspaceId: number; email: string; role: WorkspaceRole; invitedByUserId: number }) {
  const db = requireDb(await getDb());
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(workspaceInvitations).values({
    workspaceId: input.workspaceId,
    email: input.email.toLowerCase().trim(),
    role: input.role,
    token,
    invitedByUserId: input.invitedByUserId,
    expiresAt,
  });
  await db.insert(auditLogs).values({
    workspaceId: input.workspaceId,
    actorUserId: input.invitedByUserId,
    action: "workspace.invitation.created",
    targetType: "workspace_invitation",
    targetId: token,
    metadata: { email: input.email.toLowerCase().trim(), role: input.role },
  });
  return { token, expiresAt };
}

export async function listWorkspaceInvitations(workspaceId: number) {
  const db = requireDb(await getDb());
  return db.select().from(workspaceInvitations).where(eq(workspaceInvitations.workspaceId, workspaceId)).orderBy(desc(workspaceInvitations.createdAt));
}

export async function acceptWorkspaceInvitation(input: { token: string; user: User }) {
  const db = requireDb(await getDb());
  const invitationRows = await db.select().from(workspaceInvitations).where(eq(workspaceInvitations.token, input.token)).limit(1);
  const invitation = invitationRows[0];
  if (!invitation) throw new Error("Invitation not found");
  if (invitation.revokedAt || invitation.acceptedAt || invitation.expiresAt < new Date()) throw new Error("Invitation is no longer valid");
  if (!input.user.email || invitation.email.toLowerCase() !== input.user.email.toLowerCase()) throw new Error("Invitation email does not match this account");

  await db.transaction(async tx => {
    await tx.insert(workspaceMemberships).values({
      workspaceId: invitation.workspaceId,
      userId: input.user.id,
      role: invitation.role,
      status: "active",
      invitedByUserId: invitation.invitedByUserId,
    }).onDuplicateKeyUpdate({ set: { role: invitation.role, status: "active", updatedAt: new Date() } });
    await tx.update(workspaceInvitations).set({ acceptedAt: new Date() }).where(eq(workspaceInvitations.id, invitation.id));
    await tx.insert(auditLogs).values({
      workspaceId: invitation.workspaceId,
      actorUserId: input.user.id,
      action: "workspace.invitation.accepted",
      targetType: "workspace_invitation",
      targetId: invitation.token,
    });
  });
  return { workspaceId: invitation.workspaceId, role: invitation.role };
}

export async function updateWorkspaceMemberRole(input: { workspaceId: number; userId: number; role: WorkspaceRole; actorUserId: number }) {
  const db = requireDb(await getDb());
  const existing = await db.select().from(workspaceMemberships).where(and(eq(workspaceMemberships.workspaceId, input.workspaceId), eq(workspaceMemberships.userId, input.userId))).limit(1);
  const membership = existing[0];
  if (!membership) return undefined;
  if (membership.role === "owner") throw new Error("Owner role cannot be changed from this operation");
  await db.update(workspaceMemberships).set({ role: input.role }).where(eq(workspaceMemberships.id, membership.id));
  await db.insert(auditLogs).values({
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "workspace.membership.role_updated",
    targetType: "workspace_membership",
    targetId: String(membership.id),
    metadata: { userId: input.userId, fromRole: membership.role, toRole: input.role },
  });
  return { ...membership, role: input.role };
}

export async function listProjectsForWorkspace(workspaceId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.workspaceId, workspaceId), inArray(projects.status, ["draft", "active", "in_review", "approved", "delivered"])))
    .orderBy(desc(projects.updatedAt));
}

export async function searchProjectsForUser(input: { userId: number; query: string }) {
  const db = requireDb(await getDb());
  const pattern = `%${input.query.trim().replace(/[\\%_]/g, "\\$&")}%`;
  return db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      updatedAt: projects.updatedAt,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      workspaceSlug: workspaces.slug,
    })
    .from(projects)
    .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
    .innerJoin(workspaceMemberships, eq(workspaceMemberships.workspaceId, workspaces.id))
    .where(and(eq(workspaceMemberships.userId, input.userId), eq(workspaceMemberships.status, "active"), eq(workspaces.isArchived, false), like(projects.name, pattern)))
    .orderBy(desc(projects.updatedAt))
    .limit(25);
}

export async function createProject(input: { workspaceId: number; name: string; description?: string | null; createdByUserId: number }) {
  const db = requireDb(await getDb());
  const [projectResult] = await db.insert(projects).values({
    workspaceId: input.workspaceId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    status: "draft",
    createdByUserId: input.createdByUserId,
  }).$returningId();
  const projectId = projectResult?.id;
  if (!projectId) throw new Error("Project could not be created");

  await db.insert(auditLogs).values({
    workspaceId: input.workspaceId,
    actorUserId: input.createdByUserId,
    action: "project.created",
    targetType: "project",
    targetId: String(projectId),
  });

  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result[0];
}

export async function getProjectForWorkspace(projectId: number, workspaceId: number) {
  const db = requireDb(await getDb());
  const result = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId))).limit(1);
  return result[0];
}

export async function writeAuditLog(input: {
  workspaceId?: number | null;
  actorUserId?: number | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const db = requireDb(await getDb());
  await db.insert(auditLogs).values({
    workspaceId: input.workspaceId ?? null,
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    metadata: input.metadata ?? null,
  });
}

export async function registerAsset(input: {
  workspaceId: number;
  projectId?: number | null;
  name: string;
  mediaType: string;
  storageKey: string;
  sizeBytes: number;
  checksum?: string | null;
  metadata?: Record<string, unknown>;
  createdByUserId: number;
}) {
  const db = requireDb(await getDb());
  const [assetResult] = await db.insert(assets).values({
    workspaceId: input.workspaceId,
    projectId: input.projectId ?? null,
    name: input.name,
    mediaType: input.mediaType,
    storageKey: input.storageKey,
    sizeBytes: input.sizeBytes,
    checksum: input.checksum ?? null,
    metadata: input.metadata ?? null,
    status: "ready",
    createdByUserId: input.createdByUserId,
  }).$returningId();
  const assetId = assetResult?.id;
  if (!assetId) throw new Error("Asset metadata could not be created");

  await db.insert(assetVersions).values({
    assetId,
    versionNumber: 1,
    storageKey: input.storageKey,
    sizeBytes: input.sizeBytes,
    checksum: input.checksum ?? null,
    createdByUserId: input.createdByUserId,
  });
  await db.insert(auditLogs).values({
    workspaceId: input.workspaceId,
    actorUserId: input.createdByUserId,
    action: "asset.created",
    targetType: "asset",
    targetId: String(assetId),
  });
  const result = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
  return result[0];
}

export async function getAssetForWorkspace(assetId: number, workspaceId: number) {
  const db = requireDb(await getDb());
  const result = await db.select().from(assets).where(and(eq(assets.id, assetId), eq(assets.workspaceId, workspaceId))).limit(1);
  return result[0];
}

export async function listAssetsForProject(input: { workspaceId: number; projectId?: number }) {
  const db = requireDb(await getDb());
  const conditions = [eq(assets.workspaceId, input.workspaceId)];
  if (input.projectId) conditions.push(eq(assets.projectId, input.projectId));
  const assetRows = await db.select().from(assets).where(and(...conditions)).orderBy(desc(assets.updatedAt));
  const currentVersions = await Promise.all(assetRows.map(async asset => {
    const version = await db.select({ versionNumber: assetVersions.versionNumber }).from(assetVersions).where(eq(assetVersions.assetId, asset.id)).orderBy(desc(assetVersions.versionNumber)).limit(1);
    return version[0]?.versionNumber ?? 1;
  }));
  return assetRows.map((asset, index) => ({ ...asset, currentVersionNumber: currentVersions[index] }));
}

export async function listAssetVersionsForWorkspace(input: { workspaceId: number; assetId: number }) {
  const asset = await getAssetForWorkspace(input.assetId, input.workspaceId);
  if (!asset) return undefined;
  const db = requireDb(await getDb());
  const versions = await db.select().from(assetVersions).where(eq(assetVersions.assetId, input.assetId)).orderBy(desc(assetVersions.versionNumber));
  return { asset, versions };
}

export async function createAssetVersion(input: { workspaceId: number; assetId: number; storageKey: string; sizeBytes: number; checksum?: string | null; metadata?: Record<string, unknown>; createdByUserId: number }) {
  const db = requireDb(await getDb());
  const asset = await getAssetForWorkspace(input.assetId, input.workspaceId);
  if (!asset) return undefined;
  const previous = await db.select().from(assetVersions).where(eq(assetVersions.assetId, input.assetId)).orderBy(desc(assetVersions.versionNumber)).limit(1);
  const versionNumber = (previous[0]?.versionNumber ?? 0) + 1;
  await db.transaction(async tx => {
    await tx.insert(assetVersions).values({ assetId: input.assetId, versionNumber, storageKey: input.storageKey, sizeBytes: input.sizeBytes, checksum: input.checksum ?? null, createdByUserId: input.createdByUserId });
    await tx.update(assets).set({ storageKey: input.storageKey, sizeBytes: input.sizeBytes, checksum: input.checksum ?? null, metadata: input.metadata ?? asset.metadata, updatedAt: new Date() }).where(eq(assets.id, input.assetId));
    await tx.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, action: "asset.version.created", targetType: "asset", targetId: String(input.assetId), metadata: { versionNumber } });
  });
  const updated = await getAssetForWorkspace(input.assetId, input.workspaceId);
  return { asset: updated, versionNumber };
}

export async function transitionProjectStatus(input: {
  workspaceId: number;
  projectId: number;
  fromStatus?: string | null;
  toStatus: "draft" | "active" | "in_review" | "approved" | "delivered" | "archived";
  note?: string | null;
  actorUserId: number;
}) {
  const db = requireDb(await getDb());
  const existing = await db.select().from(projects).where(and(eq(projects.id, input.projectId), eq(projects.workspaceId, input.workspaceId))).limit(1);
  const project = existing[0];
  if (!project) return undefined;
  await db.update(projects).set({ status: input.toStatus, archivedAt: input.toStatus === "archived" ? new Date() : null }).where(eq(projects.id, input.projectId));
  await db.insert(workflowEvents).values({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    eventType: "project.status_changed",
    fromStatus: input.fromStatus ?? project.status,
    toStatus: input.toStatus,
    note: input.note ?? null,
    actorUserId: input.actorUserId,
  });
  await db.insert(auditLogs).values({
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "project.status_changed",
    targetType: "project",
    targetId: String(input.projectId),
    metadata: { fromStatus: input.fromStatus ?? project.status, toStatus: input.toStatus },
  });
  const updated = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
  return updated[0];
}

export async function listReviewRequests(input: { workspaceId: number; projectId: number }) {
  const db = requireDb(await getDb());
  return db.select().from(reviewRequests).where(and(eq(reviewRequests.workspaceId, input.workspaceId), eq(reviewRequests.projectId, input.projectId))).orderBy(desc(reviewRequests.createdAt));
}

export async function createReviewRequest(input: {
  workspaceId: number;
  projectId: number;
  assetId?: number;
  requestNote?: string | null;
  requestedByUserId: number;
  reviewerUserId?: number;
}) {
  const db = requireDb(await getDb());
  const [reviewResult] = await db.insert(reviewRequests).values({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    assetId: input.assetId ?? null,
    requestNote: input.requestNote ?? null,
    requestedByUserId: input.requestedByUserId,
    reviewerUserId: input.reviewerUserId ?? null,
  }).$returningId();
  const reviewId = reviewResult?.id;
  if (!reviewId) throw new Error("Review request could not be created");
  await db.insert(workflowEvents).values({ workspaceId: input.workspaceId, projectId: input.projectId, eventType: "studio.review_requested", note: input.requestNote ?? null, actorUserId: input.requestedByUserId });
  await db.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.requestedByUserId, action: "studio.review_requested", targetType: "review_request", targetId: String(reviewId) });
  if (input.reviewerUserId) await createNotification({ workspaceId: input.workspaceId, recipientUserId: input.reviewerUserId, type: "studio.review_requested", title: "Review assigned", body: input.requestNote ?? "A workspace review has been assigned to you.", actionUrl: "/studio" });
  const result = await db.select().from(reviewRequests).where(eq(reviewRequests.id, reviewId)).limit(1);
  return result[0];
}

export async function respondToReviewRequest(input: {
  workspaceId: number;
  reviewId: number;
  status: "approved" | "changes_requested";
  responseNote?: string | null;
  respondedByUserId: number;
}) {
  const db = requireDb(await getDb());
  const existing = await db.select().from(reviewRequests).where(and(eq(reviewRequests.id, input.reviewId), eq(reviewRequests.workspaceId, input.workspaceId))).limit(1);
  const review = existing[0];
  if (!review) return undefined;
  if (review.status !== "pending") throw new Error("Review request has already been resolved");
  if (review.reviewerUserId && review.reviewerUserId !== input.respondedByUserId) throw new Error("This review is assigned to another workspace member");
  await db.update(reviewRequests).set({ status: input.status, responseNote: input.responseNote ?? null, respondedByUserId: input.respondedByUserId, respondedAt: new Date() }).where(eq(reviewRequests.id, input.reviewId));
  await db.insert(workflowEvents).values({ workspaceId: input.workspaceId, projectId: review.projectId, assetId: review.assetId, eventType: `studio.review_${input.status}`, note: input.responseNote ?? null, actorUserId: input.respondedByUserId });
  await db.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.respondedByUserId, action: `studio.review_${input.status}`, targetType: "review_request", targetId: String(input.reviewId) });
  const updated = await db.select().from(reviewRequests).where(eq(reviewRequests.id, input.reviewId)).limit(1);
  return updated[0];
}

export async function listDeliveries(input: { workspaceId: number; projectId: number }) {
  const db = requireDb(await getDb());
  return db.select().from(deliveries).where(and(eq(deliveries.workspaceId, input.workspaceId), eq(deliveries.projectId, input.projectId))).orderBy(desc(deliveries.updatedAt));
}

export async function createDelivery(input: { workspaceId: number; projectId: number; destinationType: string; destinationRef?: string | null; createdByUserId: number }) {
  const db = requireDb(await getDb());
  const [deliveryResult] = await db.insert(deliveries).values({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    destinationType: input.destinationType,
    destinationRef: input.destinationRef ?? null,
    status: "draft",
    createdByUserId: input.createdByUserId,
  }).$returningId();
  const deliveryId = deliveryResult?.id;
  if (!deliveryId) throw new Error("Delivery could not be created");
  await db.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, action: "studio.delivery_created", targetType: "delivery", targetId: String(deliveryId) });
  const result = await db.select().from(deliveries).where(eq(deliveries.id, deliveryId)).limit(1);
  return result[0];
}

export async function markDeliveryReady(input: { workspaceId: number; deliveryId: number; actorUserId: number }) {
  const db = requireDb(await getDb());
  const existing = await db.select().from(deliveries).where(and(eq(deliveries.id, input.deliveryId), eq(deliveries.workspaceId, input.workspaceId))).limit(1);
  const delivery = existing[0];
  if (!delivery) return undefined;
  await db.update(deliveries).set({ status: "ready" }).where(eq(deliveries.id, input.deliveryId));
  await db.insert(workflowEvents).values({ workspaceId: input.workspaceId, projectId: delivery.projectId, eventType: "studio.delivery_ready", actorUserId: input.actorUserId });
  await db.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, action: "studio.delivery_ready", targetType: "delivery", targetId: String(input.deliveryId) });
  const updated = await db.select().from(deliveries).where(eq(deliveries.id, input.deliveryId)).limit(1);
  return updated[0];
}

export async function queueDeliveryPublishingHandoff(input: { workspaceId: number; deliveryId: number; actorUserId: number }) {
  const db = requireDb(await getDb());
  const deliveryRows = await db.select().from(deliveries).where(and(eq(deliveries.id, input.deliveryId), eq(deliveries.workspaceId, input.workspaceId))).limit(1);
  const delivery = deliveryRows[0];
  if (!delivery) return { outcome: "not_found" as const };
  if (delivery.status !== "ready") return { outcome: "not_ready" as const, delivery };
  const job = await enqueueBackgroundJob({
    workspaceId: input.workspaceId,
    jobType: "studio.provider_handoff",
    idempotencyKey: `delivery:${input.deliveryId}:provider_handoff`,
    payload: { deliveryId: input.deliveryId, projectId: delivery.projectId, destinationType: delivery.destinationType, destinationRef: delivery.destinationRef ?? null },
  });
  await writeAuditLog({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, action: "studio.delivery.publish_handoff.queued", targetType: "delivery", targetId: String(input.deliveryId), metadata: { jobId: job?.id ?? null, provider: "unconfigured" } });
  const preferences = await getNotificationPreferences(input.actorUserId);
  const notification = buildProviderHandoffNotification(input, preferences);
  if (notification) await createNotification(notification, preferences);
  return { outcome: "queued" as const, delivery, job };
}

export async function listNotificationsForUser(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(notifications).where(eq(notifications.recipientUserId, userId)).orderBy(desc(notifications.createdAt));
}

export async function getNotificationPreferences(userId: number) {
  const db = requireDb(await getDb());
  await db.insert(notificationPreferences).values({ userId }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  const preferences = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  return preferences[0];
}

export async function updateNotificationPreferences(input: { userId: number; inAppEnabled: boolean; emailEnabled: boolean }) {
  const db = requireDb(await getDb());
  await db.insert(notificationPreferences).values(input).onDuplicateKeyUpdate({ set: { inAppEnabled: input.inAppEnabled, emailEnabled: input.emailEnabled, updatedAt: new Date() } });
  return getNotificationPreferences(input.userId);
}

export function isInAppDeliveryEnabled(preferences: { inAppEnabled: boolean } | undefined) {
  return preferences?.inAppEnabled === true;
}

export function selectWorkspaceNotificationRecipientIds(members: Array<{ userId: number }>, actorUserId?: number) {
  return Array.from(new Set(members.map(member => member.userId).filter(userId => userId !== actorUserId)));
}

type NotificationInput = { workspaceId?: number | null; recipientUserId: number; type: string; title: string; body?: string | null; actionUrl?: string | null };

export function createInAppNotificationCandidate(input: NotificationInput, preferences: { inAppEnabled: boolean } | undefined) {
  return isInAppDeliveryEnabled(preferences) ? input : undefined;
}

export function buildProviderHandoffNotification(input: { workspaceId: number; actorUserId: number }, preferences: { inAppEnabled: boolean } | undefined) {
  return createInAppNotificationCandidate({ workspaceId: input.workspaceId, recipientUserId: input.actorUserId, type: "job.studio_provider_handoff.queued", title: "Publishing handoff queued", body: "A provider-neutral publishing handoff is queued. No external provider has been called.", actionUrl: "/studio" }, preferences);
}

export async function createNotification(input: NotificationInput, knownPreferences?: { inAppEnabled: boolean }) {
  const preferences = knownPreferences ?? await getNotificationPreferences(input.recipientUserId);
  const candidate = createInAppNotificationCandidate(input, preferences);
  if (!candidate) return { delivered: false as const, reason: "in_app_disabled" as const };
  const db = requireDb(await getDb());
  await db.insert(notifications).values({ workspaceId: candidate.workspaceId ?? null, recipientUserId: candidate.recipientUserId, type: candidate.type, title: candidate.title, body: candidate.body ?? null, actionUrl: candidate.actionUrl ?? null });
  return { delivered: true as const };
}

export async function notifyWorkspaceMembers(input: { workspaceId: number; actorUserId?: number; type: string; title: string; body?: string | null; actionUrl?: string | null }) {
  const db = requireDb(await getDb());
  const members = await db.select({ userId: workspaceMemberships.userId }).from(workspaceMemberships).where(and(eq(workspaceMemberships.workspaceId, input.workspaceId), eq(workspaceMemberships.status, "active")));
  const recipientIds = selectWorkspaceNotificationRecipientIds(members, input.actorUserId);
  const outcomes = await Promise.all(recipientIds.map(recipientUserId => createNotification({ ...input, recipientUserId })));
  return { recipients: recipientIds.length, delivered: outcomes.filter(outcome => outcome.delivered).length };
}

export async function markNotificationRead(input: { notificationId: number; userId: number }) {
  const db = requireDb(await getDb());
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, input.notificationId), eq(notifications.recipientUserId, input.userId)));
}

export async function enqueueBackgroundJob(input: {
  workspaceId?: number | null;
  jobType: string;
  idempotencyKey: string;
  payload?: Record<string, unknown>;
}) {
  const db = requireDb(await getDb());
  await db.insert(backgroundJobs).values({
    workspaceId: input.workspaceId ?? null,
    jobType: input.jobType,
    idempotencyKey: input.idempotencyKey,
    payload: input.payload ?? null,
  }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  const result = await db.select().from(backgroundJobs).where(eq(backgroundJobs.idempotencyKey, input.idempotencyKey)).limit(1);
  return result[0];
}

export async function listBackgroundJobsForWorkspace(workspaceId: number) {
  const db = requireDb(await getDb());
  return db.select().from(backgroundJobs).where(eq(backgroundJobs.workspaceId, workspaceId)).orderBy(desc(backgroundJobs.createdAt));
}

export async function recoverStaleBackgroundJobs(staleBefore: Date) {
  const db = requireDb(await getDb());
  const staleJobs = await db
    .select({ id: backgroundJobs.id, attempts: backgroundJobs.attempts, maxAttempts: backgroundJobs.maxAttempts })
    .from(backgroundJobs)
    .where(and(eq(backgroundJobs.status, "running"), lt(backgroundJobs.startedAt, staleBefore)));

  const retryableIds = staleJobs.filter(job => job.attempts < job.maxAttempts).map(job => job.id);
  const exhaustedIds = staleJobs.filter(job => job.attempts >= job.maxAttempts).map(job => job.id);
  if (retryableIds.length) {
    await db.update(backgroundJobs).set({
      status: "queued",
      startedAt: null,
      errorMessage: "Recovered after stale processing lease",
      updatedAt: new Date(),
    }).where(inArray(backgroundJobs.id, retryableIds));
  }
  if (exhaustedIds.length) {
    await db.update(backgroundJobs).set({
      status: "failed",
      completedAt: new Date(),
      errorMessage: "Maximum recovery attempts reached",
      updatedAt: new Date(),
    }).where(inArray(backgroundJobs.id, exhaustedIds));
  }
  return { requeued: retryableIds.length, failed: exhaustedIds.length };
}

export function getQueuedJobClaimTransition(job: { status: "queued" | "running" | "succeeded" | "failed" | "cancelled"; attempts: number; maxAttempts: number }) {
  if (job.status !== "queued") return undefined;
  if (job.attempts >= job.maxAttempts) return { status: "failed" as const, attempts: job.attempts };
  return { status: "running" as const, attempts: job.attempts + 1 };
}

/**
 * Atomically claims queued jobs with a compare-and-swap update. This function
 * intentionally only claims durable work; provider workers consume the claimed
 * records through their own reviewed adapters rather than inside a cron HTTP request.
 */
export async function claimQueuedBackgroundJobs(limit = 25) {
  const db = requireDb(await getDb());
  const candidates = await db.select({ id: backgroundJobs.id, attempts: backgroundJobs.attempts, maxAttempts: backgroundJobs.maxAttempts })
    .from(backgroundJobs)
    .where(eq(backgroundJobs.status, "queued"))
    .orderBy(asc(backgroundJobs.createdAt))
    .limit(limit);
  const claimedJobIds: number[] = [];
  let exhausted = 0;

  for (const job of candidates) {
    const transition = getQueuedJobClaimTransition({ status: "queued", attempts: job.attempts, maxAttempts: job.maxAttempts });
    if (!transition) continue;
    const isExhausted = transition.status === "failed";
    const result = await db.update(backgroundJobs).set(isExhausted ? {
      status: "failed",
      completedAt: new Date(),
      errorMessage: "Maximum recovery attempts reached",
      updatedAt: new Date(),
    } : {
      status: "running",
      attempts: transition.attempts,
      startedAt: new Date(),
      errorMessage: null,
      updatedAt: new Date(),
    }).where(and(eq(backgroundJobs.id, job.id), eq(backgroundJobs.status, "queued"), eq(backgroundJobs.attempts, job.attempts)));
    const affectedRows = Number((result as unknown as { affectedRows?: number }).affectedRows ?? 0);
    if (affectedRows !== 1) continue;
    if (isExhausted) exhausted += 1;
    else claimedJobIds.push(job.id);
  }
  return { claimed: claimedJobIds.length, exhausted, jobIds: claimedJobIds };
}

type BackgroundJobTelemetryRow = { id: number; jobType: string; status: "queued" | "running" | "succeeded" | "failed" | "cancelled"; attempts: number; maxAttempts: number; createdAt: Date; updatedAt: Date; startedAt: Date | null; completedAt: Date | null };
const PROVIDER_HANDOFF_ESCALATION_MS = 15 * 60 * 1000;

export function isHeavyMediaJobType(jobType: string) {
  return jobType === "studio.provider_handoff" || jobType.startsWith("media.") || ["asset.render", "asset.transcode", "asset.video_processing"].includes(jobType);
}

export function summarizeBackgroundJobTelemetry(rows: BackgroundJobTelemetryRow[], now = new Date()) {
  const counts = rows.reduce<Record<string, number>>((accumulator, row) => {
    accumulator[row.status] = (accumulator[row.status] ?? 0) + 1;
    return accumulator;
  }, {});
  const oldestQueued = rows.filter(row => row.status === "queued").sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  const queueLatencyMs = oldestQueued ? Math.max(0, now.getTime() - oldestQueued.createdAt.getTime()) : 0;
  const retryingJobs = rows.filter(row => ["queued", "running"].includes(row.status) && row.attempts > 0).length;
  const deadLetterJobs = rows.filter(row => row.status === "failed" && row.attempts >= row.maxAttempts).length;
  const providerHandoffEscalationJobIds = rows.filter(row => row.jobType === "studio.provider_handoff" && (row.status === "failed" || (row.status === "queued" && now.getTime() - row.createdAt.getTime() >= PROVIDER_HANDOFF_ESCALATION_MS))).map(row => row.id);
  const heavyMediaEscalationJobIds = rows.filter(row => isHeavyMediaJobType(row.jobType) && (row.status === "failed" || (row.status === "queued" && now.getTime() - row.createdAt.getTime() >= PROVIDER_HANDOFF_ESCALATION_MS))).map(row => row.id);
  return { counts, oldestQueuedAt: oldestQueued?.createdAt ?? null, queueLatencyMs, retryingJobs, deadLetterJobs, providerHandoffEscalationJobIds, heavyMediaEscalationJobIds };
}

export async function getBackgroundJobHealth() {
  const db = requireDb(await getDb());
  const rows = await db.select({ id: backgroundJobs.id, jobType: backgroundJobs.jobType, status: backgroundJobs.status, attempts: backgroundJobs.attempts, maxAttempts: backgroundJobs.maxAttempts, createdAt: backgroundJobs.createdAt, updatedAt: backgroundJobs.updatedAt, startedAt: backgroundJobs.startedAt, completedAt: backgroundJobs.completedAt })
    .from(backgroundJobs)
    .orderBy(desc(backgroundJobs.createdAt))
    .limit(250);
  return summarizeBackgroundJobTelemetry(rows);
}

export async function listPlatformWorkspaces() {
  const db = requireDb(await getDb());
  return db.select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug, kind: workspaces.kind, organizationId: workspaces.organizationId, isArchived: workspaces.isArchived, createdAt: workspaces.createdAt, updatedAt: workspaces.updatedAt })
    .from(workspaces)
    .orderBy(desc(workspaces.updatedAt))
    .limit(100);
}

export async function listPlatformFeatureFlags() {
  const db = requireDb(await getDb());
  return db.select().from(featureFlags).orderBy(desc(featureFlags.updatedAt)).limit(100);
}

export async function setWorkspaceFeatureFlag(input: { key: string; workspaceId?: number | null; isEnabled: boolean; description?: string | null; createdByUserId: number }) {
  const db = requireDb(await getDb());
  const existing = await db.select().from(featureFlags).where(and(eq(featureFlags.key, input.key), input.workspaceId ? eq(featureFlags.workspaceId, input.workspaceId) : undefined)).limit(1);
  if (existing[0]) {
    await db.update(featureFlags).set({ isEnabled: input.isEnabled, description: input.description ?? null }).where(eq(featureFlags.id, existing[0].id));
    return { ...existing[0], isEnabled: input.isEnabled, description: input.description ?? null };
  }
  const [result] = await db.insert(featureFlags).values({ key: input.key, workspaceId: input.workspaceId ?? null, isEnabled: input.isEnabled, description: input.description ?? null, createdByUserId: input.createdByUserId }).$returningId();
  const id = result?.id;
  if (!id) throw new Error("Feature flag could not be saved");
  const created = await db.select().from(featureFlags).where(eq(featureFlags.id, id)).limit(1);
  return created[0];
}

export async function listPlans() {
  const db = requireDb(await getDb());
  return db.select().from(plans).orderBy(asc(plans.name));
}

export async function createPlan(input: { slug: string; name: string; description?: string | null }) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(plans).values({ slug: input.slug, name: input.name, description: input.description ?? null }).$returningId();
  const planId = result?.id;
  if (!planId) throw new Error("Plan could not be created");
  const created = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  return created[0];
}

export async function listWorkspaceEntitlements(workspaceId: number) {
  const db = requireDb(await getDb());
  return db.select().from(workspaceEntitlements).where(eq(workspaceEntitlements.workspaceId, workspaceId)).orderBy(asc(workspaceEntitlements.capability));
}

export function isWorkspaceCapabilityEnabled(entitlements: Array<{ capability: string; isEnabled: boolean }>, capability: string) {
  return entitlements.find(entitlement => entitlement.capability === capability)?.isEnabled ?? true;
}

export async function setWorkspaceEntitlement(input: { workspaceId: number; planId?: number | null; capability: string; isEnabled: boolean; usageLimit?: number | null }) {
  const db = requireDb(await getDb());
  const existing = await db.select().from(workspaceEntitlements).where(and(eq(workspaceEntitlements.workspaceId, input.workspaceId), eq(workspaceEntitlements.capability, input.capability))).limit(1);
  if (existing[0]) {
    await db.update(workspaceEntitlements).set({ planId: input.planId ?? null, isEnabled: input.isEnabled, usageLimit: input.usageLimit ?? null }).where(eq(workspaceEntitlements.id, existing[0].id));
    return { ...existing[0], planId: input.planId ?? null, isEnabled: input.isEnabled, usageLimit: input.usageLimit ?? null };
  }
  const [result] = await db.insert(workspaceEntitlements).values({ workspaceId: input.workspaceId, planId: input.planId ?? null, capability: input.capability, isEnabled: input.isEnabled, usageLimit: input.usageLimit ?? null }).$returningId();
  const id = result?.id;
  if (!id) throw new Error("Entitlement could not be saved");
  const created = await db.select().from(workspaceEntitlements).where(eq(workspaceEntitlements.id, id)).limit(1);
  return created[0];
}

export async function listRecentSupportAudits() {
  const db = requireDb(await getDb());
  return db.select().from(auditLogs).where(like(auditLogs.action, "support.%")).orderBy(desc(auditLogs.createdAt)).limit(50);
}

export async function listRecentPlatformActivity() {
  const db = requireDb(await getDb());
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(30);
}
