import { and, desc, eq } from "drizzle-orm";
import {
  auditLogs,
  guidedManualRenderHandoffs,
  guidedRenderPackages,
  guidedStageStates,
  guidedWreathBlueprints,
  guidedWreathRecipeItems,
  guidedWreathRecipes,
  memoryThreadEvents,
  projects,
  stageApprovals,
} from "../drizzle/schema";
import { getDb } from "./db";
import { compileRenderPackageManifest, type RenderPackageItem } from "./guidedRenders";

function requireDb<T>(db: T | null): T {
  if (!db) throw new Error("Database is unavailable");
  return db;
}

export async function getGuidedRenderPackage(projectId: number) {
  const db = requireDb(await getDb());
  const renderPackage = (await db.select().from(guidedRenderPackages).where(eq(guidedRenderPackages.projectId, projectId)).orderBy(desc(guidedRenderPackages.version)).limit(1))[0] ?? null;
  const handoff = renderPackage
    ? (await db.select().from(guidedManualRenderHandoffs).where(eq(guidedManualRenderHandoffs.renderPackageId, renderPackage.id)).limit(1))[0] ?? null
    : null;
  return { renderPackage, handoff };
}

export async function prepareGuidedRenderPackage(input: { projectId: number; workspaceId: number; createdByUserId: number }) {
  const db = requireDb(await getDb());
  await db.transaction(async tx => {
    const project = (await tx.select().from(projects).where(and(eq(projects.id, input.projectId), eq(projects.workspaceId, input.workspaceId))).limit(1))[0];
    if (!project) throw new Error("Guided Wreath project not found in this workspace");
    const recipe = (await tx.select().from(guidedWreathRecipes).where(and(eq(guidedWreathRecipes.projectId, input.projectId), eq(guidedWreathRecipes.status, "locked"))).orderBy(desc(guidedWreathRecipes.version)).limit(1))[0];
    if (!recipe) throw new Error("Lock a current Recipe before preparing a render package.");
    const blueprint = (await tx.select().from(guidedWreathBlueprints).where(and(eq(guidedWreathBlueprints.projectId, input.projectId), eq(guidedWreathBlueprints.recipeId, recipe.id), eq(guidedWreathBlueprints.status, "ready"))).limit(1))[0];
    if (!blueprint) throw new Error("Generate a current simplified Blueprint before preparing a render package.");
    const existing = (await tx.select().from(guidedRenderPackages).where(eq(guidedRenderPackages.blueprintId, blueprint.id)).limit(1))[0];
    if (existing && existing.status !== "stale") return;
    const items = await tx.select().from(guidedWreathRecipeItems).where(eq(guidedWreathRecipeItems.recipeId, recipe.id));
    const manifest = compileRenderPackageManifest({
      recipeId: recipe.id,
      recipeVersion: recipe.version,
      blueprintId: blueprint.id,
      blueprintVersion: blueprint.version,
      hierarchy: blueprint.hierarchy,
      derivationNotes: blueprint.derivationNotes,
      items: items.map(item => ({ role: item.role as RenderPackageItem["role"], familyKey: item.familyKeySnapshot, commonName: item.commonNameSnapshot, selectionRationale: item.selectionRationaleSnapshot })),
    });
    const prior = await tx.select({ version: guidedRenderPackages.version }).from(guidedRenderPackages).where(eq(guidedRenderPackages.projectId, input.projectId)).orderBy(desc(guidedRenderPackages.version)).limit(1);
    const [created] = await tx.insert(guidedRenderPackages).values({ projectId: input.projectId, recipeId: recipe.id, blueprintId: blueprint.id, version: (prior[0]?.version ?? 0) + 1, manifest, createdByUserId: input.createdByUserId }).$returningId();
    if (!created?.id) throw new Error("Render package could not be prepared");
    await tx.insert(guidedStageStates).values({ projectId: input.projectId, currentStage: "wreath", status: "draft", blockReason: "Your render package is ready for review. Approve it before requesting a manual handoff.", updatedByUserId: input.createdByUserId }).onDuplicateKeyUpdate({ set: { currentStage: "wreath", status: "draft", blockReason: "Your render package is ready for review. Approve it before requesting a manual handoff.", updatedByUserId: input.createdByUserId, updatedAt: new Date() } });
    await tx.insert(memoryThreadEvents).values({ projectId: input.projectId, stage: "wreath", sourceType: "guided_render_package", sourceId: created.id, sourceVersion: (prior[0]?.version ?? 0) + 1, summary: `Render package v${(prior[0]?.version ?? 0) + 1} prepared from Recipe v${recipe.version} and Blueprint v${blueprint.version}.`, isDirectSource: false, createdByUserId: input.createdByUserId });
    await tx.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, action: "guided_wreath.render_package.prepared", targetType: "guided_render_package", targetId: String(created.id), metadata: { projectId: input.projectId, recipeId: recipe.id, blueprintId: blueprint.id } });
  });
  return getGuidedRenderPackage(input.projectId);
}

export async function approveGuidedRenderPackage(input: { projectId: number; workspaceId: number; renderPackageId: number; approvedByUserId: number }) {
  const db = requireDb(await getDb());
  await db.transaction(async tx => {
    const renderPackage = (await tx.select().from(guidedRenderPackages).where(and(eq(guidedRenderPackages.id, input.renderPackageId), eq(guidedRenderPackages.projectId, input.projectId), eq(guidedRenderPackages.status, "draft"))).limit(1))[0];
    if (!renderPackage) throw new Error("A current draft render package is required for approval.");
    await tx.update(guidedRenderPackages).set({ status: "approved", approvedAt: new Date() }).where(eq(guidedRenderPackages.id, renderPackage.id));
    await tx.insert(stageApprovals).values({ projectId: input.projectId, stage: "wreath", entityType: "guided_render_package", entityId: renderPackage.id, entityVersion: renderPackage.version, decision: "approved", note: "Approved render package for a future manual provider workflow.", decidedByUserId: input.approvedByUserId });
    await tx.insert(guidedStageStates).values({ projectId: input.projectId, currentStage: "wreath", status: "draft", blockReason: "Render package approved. You may request a manual handoff; no provider is configured or called automatically.", updatedByUserId: input.approvedByUserId }).onDuplicateKeyUpdate({ set: { currentStage: "wreath", status: "draft", blockReason: "Render package approved. You may request a manual handoff; no provider is configured or called automatically.", updatedByUserId: input.approvedByUserId, updatedAt: new Date() } });
    await tx.insert(memoryThreadEvents).values({ projectId: input.projectId, stage: "wreath", sourceType: "guided_render_package_approval", sourceId: renderPackage.id, sourceVersion: renderPackage.version, summary: `Render package v${renderPackage.version} approved for manual handoff.`, isDirectSource: false, createdByUserId: input.approvedByUserId });
    await tx.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.approvedByUserId, action: "guided_wreath.render_package.approved", targetType: "guided_render_package", targetId: String(renderPackage.id), metadata: { projectId: input.projectId, version: renderPackage.version } });
  });
  return getGuidedRenderPackage(input.projectId);
}

export async function requestManualRenderHandoff(input: { projectId: number; workspaceId: number; renderPackageId: number; requestNote?: string; requestedByUserId: number }) {
  const db = requireDb(await getDb());
  await db.transaction(async tx => {
    const renderPackage = (await tx.select().from(guidedRenderPackages).where(and(eq(guidedRenderPackages.id, input.renderPackageId), eq(guidedRenderPackages.projectId, input.projectId), eq(guidedRenderPackages.status, "approved"))).limit(1))[0];
    if (!renderPackage) throw new Error("Approve a current render package before requesting a manual handoff.");
    const existing = (await tx.select().from(guidedManualRenderHandoffs).where(eq(guidedManualRenderHandoffs.renderPackageId, renderPackage.id)).limit(1))[0];
    if (existing) return;
    const [created] = await tx.insert(guidedManualRenderHandoffs).values({ projectId: input.projectId, renderPackageId: renderPackage.id, requestNote: input.requestNote, requestedByUserId: input.requestedByUserId }).$returningId();
    if (!created?.id) throw new Error("Manual handoff intent could not be recorded");
    await tx.insert(guidedStageStates).values({ projectId: input.projectId, currentStage: "wreath", status: "draft", blockReason: "Manual handoff requested. A provider is not configured, so no render task or image has been created.", updatedByUserId: input.requestedByUserId }).onDuplicateKeyUpdate({ set: { currentStage: "wreath", status: "draft", blockReason: "Manual handoff requested. A provider is not configured, so no render task or image has been created.", updatedByUserId: input.requestedByUserId, updatedAt: new Date() } });
    await tx.insert(memoryThreadEvents).values({ projectId: input.projectId, stage: "wreath", sourceType: "guided_manual_render_handoff", sourceId: created.id, sourceVersion: renderPackage.version, summary: `Manual provider-neutral handoff requested for render package v${renderPackage.version}.`, isDirectSource: false, createdByUserId: input.requestedByUserId });
    await tx.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.requestedByUserId, action: "guided_wreath.render_handoff.requested", targetType: "guided_manual_render_handoff", targetId: String(created.id), metadata: { projectId: input.projectId, renderPackageId: renderPackage.id } });
  });
  return getGuidedRenderPackage(input.projectId);
}
