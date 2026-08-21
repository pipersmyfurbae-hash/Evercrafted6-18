import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
  auditLogs,
  botanicalReferenceCatalog,
  guidedFloralCandidates,
  guidedFloralCompatibilityReports,
  guidedFloralRoleSets,
  guidedManualRenderHandoffs,
  guidedRenderPackages,
  guidedRenderRevisionRequests,
  guidedStageStates,
  guidedWreathBlueprints,
  guidedWreathRecipeItems,
  guidedWreathRecipes,
  guidedWreathTraySelections,
  memoryThreadEvents,
  projects,
  stageApprovals,
} from "../drizzle/schema";
import { getDb } from "./db";
import { guidedFloralRoles, type GuidedFloralRole } from "./guidedFlorals";
import { compileSimplifiedBlueprint } from "./guidedRecipes";

function requireDb<T>(db: T | null): T {
  if (!db) throw new Error("Database is unavailable");
  return db;
}

export async function getGuidedRecipeBlueprint(projectId: number) {
  const db = requireDb(await getDb());
  const recipe = (await db.select().from(guidedWreathRecipes).where(eq(guidedWreathRecipes.projectId, projectId)).orderBy(desc(guidedWreathRecipes.version)).limit(1))[0] ?? null;
  if (!recipe) return { recipe: null, items: [], blueprint: null };
  const items = await db.select({ item: guidedWreathRecipeItems, catalog: botanicalReferenceCatalog })
    .from(guidedWreathRecipeItems)
    .innerJoin(botanicalReferenceCatalog, eq(guidedWreathRecipeItems.catalogItemId, botanicalReferenceCatalog.id))
    .where(eq(guidedWreathRecipeItems.recipeId, recipe.id))
    .orderBy(asc(guidedWreathRecipeItems.role));
  const blueprint = (await db.select().from(guidedWreathBlueprints).where(eq(guidedWreathBlueprints.recipeId, recipe.id)).limit(1))[0] ?? null;
  return { recipe, items, blueprint };
}

export async function lockGuidedWreathRecipe(input: { projectId: number; workspaceId: number; lockedByUserId: number }) {
  const db = requireDb(await getDb());
  await db.transaction(async tx => {
    const project = (await tx.select().from(projects).where(and(eq(projects.id, input.projectId), eq(projects.workspaceId, input.workspaceId))).limit(1))[0];
    if (!project) throw new Error("Guided Wreath project not found in this workspace");
    const roleSet = (await tx.select().from(guidedFloralRoleSets).where(eq(guidedFloralRoleSets.projectId, input.projectId)).orderBy(desc(guidedFloralRoleSets.version)).limit(1))[0];
    if (!roleSet || roleSet.status !== "complete") throw new Error("Complete every Guided Florals role before Recipe lock.");
    const compatibility = (await tx.select().from(guidedFloralCompatibilityReports).where(eq(guidedFloralCompatibilityReports.roleSetId, roleSet.id)).limit(1))[0];
    if (!compatibility || compatibility.outcome !== "pass") throw new Error("Resolve every compatibility warning and block before Recipe lock.");
    const selections = await tx.select({ selection: guidedWreathTraySelections, candidate: guidedFloralCandidates, catalog: botanicalReferenceCatalog })
      .from(guidedWreathTraySelections)
      .innerJoin(guidedFloralCandidates, eq(guidedWreathTraySelections.candidateId, guidedFloralCandidates.id))
      .innerJoin(botanicalReferenceCatalog, eq(guidedWreathTraySelections.catalogItemId, botanicalReferenceCatalog.id))
      .where(and(eq(guidedWreathTraySelections.projectId, input.projectId), eq(guidedWreathTraySelections.roleSetId, roleSet.id)));
    if (selections.length !== guidedFloralRoles.length || new Set(selections.map(item => item.selection.role)).size !== guidedFloralRoles.length) {
      throw new Error("Choose exactly one approved reference family for every required role before Recipe lock.");
    }
    if (selections.some(item => item.catalog.provenance !== "reference_fixture" && item.catalog.provenance !== "vetted")) {
      throw new Error("Every saved reference must retain approved catalog provenance before Recipe lock.");
    }
    const current = (await tx.select().from(guidedWreathRecipes).where(and(eq(guidedWreathRecipes.projectId, input.projectId), eq(guidedWreathRecipes.roleSetId, roleSet.id), eq(guidedWreathRecipes.status, "locked"))).limit(1))[0];
    if (current) return;
    const priorVersions = await tx.select({ version: guidedWreathRecipes.version }).from(guidedWreathRecipes).where(eq(guidedWreathRecipes.projectId, input.projectId)).orderBy(desc(guidedWreathRecipes.version)).limit(1);
    const [created] = await tx.insert(guidedWreathRecipes).values({
      projectId: input.projectId,
      roleSetId: roleSet.id,
      version: (priorVersions[0]?.version ?? 0) + 1,
      status: "locked",
      compatibilitySnapshot: compatibility.checks,
      lockedByUserId: input.lockedByUserId,
    }).$returningId();
    if (!created?.id) throw new Error("Recipe lock could not be created");
    await tx.insert(guidedWreathRecipeItems).values(selections.map(item => ({
      recipeId: created.id,
      role: item.selection.role,
      candidateId: item.candidate.id,
      catalogItemId: item.catalog.id,
      familyKeySnapshot: item.catalog.familyKey,
      commonNameSnapshot: item.catalog.commonName,
      selectionRationaleSnapshot: item.selection.selectionRationale,
    })));
    await tx.insert(stageApprovals).values({ projectId: input.projectId, stage: "recipe", entityType: "guided_wreath_recipe", entityId: created.id, entityVersion: (priorVersions[0]?.version ?? 0) + 1, decision: "approved", note: "Locked from a passing My Wreath Tray snapshot.", decidedByUserId: input.lockedByUserId });
    await tx.insert(guidedStageStates).values({ projectId: input.projectId, currentStage: "blueprint", status: "draft", blockReason: "Recipe locked. You can now generate a simplified hierarchy Blueprint; rendering remains unavailable.", updatedByUserId: input.lockedByUserId }).onDuplicateKeyUpdate({ set: { currentStage: "blueprint", status: "draft", blockReason: "Recipe locked. You can now generate a simplified hierarchy Blueprint; rendering remains unavailable.", updatedByUserId: input.lockedByUserId, updatedAt: new Date() } });
    await tx.insert(memoryThreadEvents).values({ projectId: input.projectId, stage: "recipe", sourceType: "guided_wreath_recipe", sourceId: created.id, sourceVersion: (priorVersions[0]?.version ?? 0) + 1, summary: `Recipe v${(priorVersions[0]?.version ?? 0) + 1} locked from the passing My Wreath Tray.`, isDirectSource: false, createdByUserId: input.lockedByUserId });
    await tx.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.lockedByUserId, action: "guided_wreath.recipe.locked", targetType: "guided_wreath_recipe", targetId: String(created.id), metadata: { projectId: input.projectId, roleSetId: roleSet.id, roleCount: selections.length } });
  });
  return getGuidedRecipeBlueprint(input.projectId);
}

export async function generateGuidedWreathBlueprint(input: { projectId: number; workspaceId: number; createdByUserId: number }) {
  const db = requireDb(await getDb());
  await db.transaction(async tx => {
    const project = (await tx.select().from(projects).where(and(eq(projects.id, input.projectId), eq(projects.workspaceId, input.workspaceId))).limit(1))[0];
    if (!project) throw new Error("Guided Wreath project not found in this workspace");
    const recipe = (await tx.select().from(guidedWreathRecipes).where(and(eq(guidedWreathRecipes.projectId, input.projectId), eq(guidedWreathRecipes.status, "locked"))).orderBy(desc(guidedWreathRecipes.version)).limit(1))[0];
    if (!recipe) throw new Error("Lock a passing Recipe before generating the simplified Blueprint.");
    const existing = (await tx.select().from(guidedWreathBlueprints).where(eq(guidedWreathBlueprints.recipeId, recipe.id)).limit(1))[0];
    if (existing) return;
    const roleSet = (await tx.select().from(guidedFloralRoleSets).where(eq(guidedFloralRoleSets.id, recipe.roleSetId)).limit(1))[0];
    if (!roleSet) throw new Error("The Recipe source role set is unavailable");
    const items = await tx.select().from(guidedWreathRecipeItems).where(eq(guidedWreathRecipeItems.recipeId, recipe.id));
    const compiled = compileSimplifiedBlueprint({ recipeVersion: recipe.version, roleSetVersion: roleSet.version, items: items.map(item => ({ role: item.role as GuidedFloralRole, familyKey: item.familyKeySnapshot, commonName: item.commonNameSnapshot, selectionRationale: item.selectionRationaleSnapshot })) });
    const priorVersions = await tx.select({ version: guidedWreathBlueprints.version }).from(guidedWreathBlueprints).where(eq(guidedWreathBlueprints.projectId, input.projectId)).orderBy(desc(guidedWreathBlueprints.version)).limit(1);
    const [created] = await tx.insert(guidedWreathBlueprints).values({ projectId: input.projectId, recipeId: recipe.id, version: (priorVersions[0]?.version ?? 0) + 1, status: "ready", hierarchy: compiled.hierarchy, derivationNotes: compiled.derivationNotes, createdByUserId: input.createdByUserId }).$returningId();
    if (!created?.id) throw new Error("Simplified Blueprint could not be created");
    await tx.insert(guidedStageStates).values({ projectId: input.projectId, currentStage: "blueprint", status: "complete", blockReason: "Your simplified Blueprint is ready. Render review remains a separate, unconfigured checkpoint.", updatedByUserId: input.createdByUserId }).onDuplicateKeyUpdate({ set: { currentStage: "blueprint", status: "complete", blockReason: "Your simplified Blueprint is ready. Render review remains a separate, unconfigured checkpoint.", updatedByUserId: input.createdByUserId, updatedAt: new Date() } });
    await tx.insert(memoryThreadEvents).values({ projectId: input.projectId, stage: "blueprint", sourceType: "guided_wreath_blueprint", sourceId: created.id, sourceVersion: (priorVersions[0]?.version ?? 0) + 1, summary: `Simplified Blueprint v${(priorVersions[0]?.version ?? 0) + 1} derived from Recipe v${recipe.version}.`, isDirectSource: false, createdByUserId: input.createdByUserId });
    await tx.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, action: "guided_wreath.blueprint.generated", targetType: "guided_wreath_blueprint", targetId: String(created.id), metadata: { projectId: input.projectId, recipeId: recipe.id, recipeVersion: recipe.version } });
  });
  return getGuidedRecipeBlueprint(input.projectId);
}

export async function invalidateGuidedRecipeBlueprints(input: { projectId: number; workspaceId: number; roleSetId: number; actorUserId: number; reason: string }) {
  const db = requireDb(await getDb());
  return db.transaction(async tx => {
    const activeRecipes = await tx.select({ id: guidedWreathRecipes.id, version: guidedWreathRecipes.version }).from(guidedWreathRecipes).where(and(eq(guidedWreathRecipes.projectId, input.projectId), eq(guidedWreathRecipes.roleSetId, input.roleSetId), eq(guidedWreathRecipes.status, "locked")));
    if (!activeRecipes.length) return 0;
    const recipeIds = activeRecipes.map(recipe => recipe.id);
    const activeBlueprints = await tx.select({ id: guidedWreathBlueprints.id }).from(guidedWreathBlueprints).where(inArray(guidedWreathBlueprints.recipeId, recipeIds));
    const blueprintIds = activeBlueprints.map(blueprint => blueprint.id);
    const activePackages = blueprintIds.length
      ? await tx.select({ id: guidedRenderPackages.id }).from(guidedRenderPackages).where(inArray(guidedRenderPackages.blueprintId, blueprintIds))
      : [];
    const packageIds = activePackages.map(renderPackage => renderPackage.id);
    await tx.update(guidedWreathRecipes).set({ status: "stale", staleReason: input.reason, staleAt: new Date() }).where(inArray(guidedWreathRecipes.id, recipeIds));
    await tx.update(guidedWreathBlueprints).set({ status: "stale", staleReason: input.reason, staleAt: new Date() }).where(inArray(guidedWreathBlueprints.recipeId, recipeIds));
    if (packageIds.length) {
      await tx.update(guidedRenderPackages).set({ status: "stale", staleReason: input.reason, staleAt: new Date() }).where(inArray(guidedRenderPackages.id, packageIds));
      await tx.update(guidedManualRenderHandoffs).set({ status: "stale", staleReason: input.reason, staleAt: new Date() }).where(inArray(guidedManualRenderHandoffs.renderPackageId, packageIds));
      await tx.update(guidedRenderRevisionRequests).set({ status: "stale", staleReason: input.reason, staleAt: new Date() }).where(inArray(guidedRenderRevisionRequests.renderPackageId, packageIds));
    }
    await tx.insert(memoryThreadEvents).values({ projectId: input.projectId, stage: "recipe", sourceType: "guided_wreath_recipe_invalidation", sourceId: recipeIds[0], sourceVersion: activeRecipes[0].version, summary: input.reason, isDirectSource: false, createdByUserId: input.actorUserId });
    await tx.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, action: "guided_wreath.recipe.invalidated", targetType: "guided_wreath_recipe", targetId: recipeIds.join(","), metadata: { projectId: input.projectId, reason: input.reason, invalidatedRecipeCount: recipeIds.length } });
    return recipeIds.length;
  });
}
