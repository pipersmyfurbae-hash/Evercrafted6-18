import { and, desc, eq, inArray } from "drizzle-orm";
import { auditLogs, guidedManualRenderHandoffs, guidedRenderPackages, guidedRenderRevisionRequests, guidedStageStates, memoryThreadEvents, projects, stageApprovals } from "../drizzle/schema";
import { getDb } from "./db";
import { compareRenderPackageManifests } from "./guidedRevisions";

function requireDb<T>(db: T | null): T {
  if (!db) throw new Error("Database is unavailable");
  return db;
}

export async function getGuidedRenderRevisionData(projectId: number) {
  const db = requireDb(await getDb());
  const history = await db.select().from(guidedRenderPackages).where(eq(guidedRenderPackages.projectId, projectId)).orderBy(desc(guidedRenderPackages.version));
  const packageIds = history.map(renderPackage => renderPackage.id);
  const revisionRequests = packageIds.length
    ? await db.select().from(guidedRenderRevisionRequests).where(inArray(guidedRenderRevisionRequests.renderPackageId, packageIds)).orderBy(desc(guidedRenderRevisionRequests.version))
    : [];
  return { history, revisionRequests };
}

export async function getGuidedRenderPackageComparison(input: { projectId: number; primaryPackageId: number; baselinePackageId: number }) {
  if (input.primaryPackageId === input.baselinePackageId) throw new Error("Choose two different render package versions to compare.");
  const db = requireDb(await getDb());
  const packages = await db.select().from(guidedRenderPackages).where(and(eq(guidedRenderPackages.projectId, input.projectId), inArray(guidedRenderPackages.id, [input.primaryPackageId, input.baselinePackageId])));
  const primary = packages.find(renderPackage => renderPackage.id === input.primaryPackageId);
  const baseline = packages.find(renderPackage => renderPackage.id === input.baselinePackageId);
  if (!primary || !baseline) throw new Error("Each compared render package must belong to this private project.");
  return compareRenderPackageManifests({ primary, baseline });
}

export async function requestGuidedRenderRevision(input: { projectId: number; workspaceId: number; renderPackageId: number; reason: string; requestedByUserId: number }) {
  const db = requireDb(await getDb());
  await db.transaction(async tx => {
    const project = (await tx.select().from(projects).where(and(eq(projects.id, input.projectId), eq(projects.workspaceId, input.workspaceId))).limit(1))[0];
    if (!project) throw new Error("Guided Wreath project not found in this workspace");
    const renderPackage = (await tx.select().from(guidedRenderPackages).where(and(eq(guidedRenderPackages.id, input.renderPackageId), eq(guidedRenderPackages.projectId, input.projectId), eq(guidedRenderPackages.status, "approved"))).limit(1))[0];
    if (!renderPackage) throw new Error("A current approved render package is required before requesting a revision.");
    const existing = (await tx.select().from(guidedRenderRevisionRequests).where(eq(guidedRenderRevisionRequests.renderPackageId, renderPackage.id)).limit(1))[0];
    if (existing) return;
    const handoff = (await tx.select().from(guidedManualRenderHandoffs).where(eq(guidedManualRenderHandoffs.renderPackageId, renderPackage.id)).limit(1))[0];
    if (handoff) throw new Error("A manual handoff is already recorded for this package. A later controlled workflow must resolve its status before a revision can be requested.");
    const prior = await tx.select({ version: guidedRenderRevisionRequests.version }).from(guidedRenderRevisionRequests).where(eq(guidedRenderRevisionRequests.projectId, input.projectId)).orderBy(desc(guidedRenderRevisionRequests.version)).limit(1);
    const version = (prior[0]?.version ?? 0) + 1;
    const [created] = await tx.insert(guidedRenderRevisionRequests).values({ projectId: input.projectId, renderPackageId: renderPackage.id, version, reason: input.reason.trim(), requestedByUserId: input.requestedByUserId }).$returningId();
    if (!created?.id) throw new Error("Controlled revision request could not be recorded");
    const blockReason = "Revision requested for this approved package. Its history remains intact; revisit the source-safe Guided Florals, Recipe, and Blueprint decisions before preparing any later package.";
    await tx.insert(stageApprovals).values({ projectId: input.projectId, stage: "wreath", entityType: "guided_render_revision_request", entityId: created.id, entityVersion: version, decision: "revision_requested", note: input.reason.trim(), decidedByUserId: input.requestedByUserId });
    await tx.insert(guidedStageStates).values({ projectId: input.projectId, currentStage: "wreath", status: "blocked", blockReason, updatedByUserId: input.requestedByUserId }).onDuplicateKeyUpdate({ set: { currentStage: "wreath", status: "blocked", blockReason, updatedByUserId: input.requestedByUserId, updatedAt: new Date() } });
    await tx.insert(memoryThreadEvents).values({ projectId: input.projectId, stage: "wreath", sourceType: "guided_render_revision_request", sourceId: created.id, sourceVersion: version, summary: `Controlled revision requested for render package v${renderPackage.version}.`, isDirectSource: false, createdByUserId: input.requestedByUserId });
    await tx.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.requestedByUserId, action: "guided_wreath.render_revision.requested", targetType: "guided_render_revision_request", targetId: String(created.id), metadata: { projectId: input.projectId, renderPackageId: renderPackage.id, renderPackageVersion: renderPackage.version } });
  });
  return getGuidedRenderRevisionData(input.projectId);
}
