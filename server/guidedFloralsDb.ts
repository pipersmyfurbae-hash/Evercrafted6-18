import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
  auditLogs,
  botanicalReferenceCatalog,
  essenceProfiles,
  guidedFloralCandidates,
  guidedFloralCompatibilityReports,
  guidedFloralRoleSets,
  guidedStageStates,
  guidedWreathTraySelections,
  memoryStories,
  memoryThreadEvents,
  projects,
} from "../drizzle/schema";
import { getDb } from "./db";
import { buildGuidedFloralCandidates, evaluateGuidedFloralCompatibility, GUIDED_FLORAL_CATALOG_VERSION, referenceBotanicalCatalog, type GuidedFloralRole } from "./guidedFlorals";

function requireDb<T>(db: T | null): T {
  if (!db) throw new Error("Database is unavailable");
  return db;
}

async function ensureReferenceCatalog() {
  const db = requireDb(await getDb());
  for (const item of referenceBotanicalCatalog) {
    await db.insert(botanicalReferenceCatalog).values({
      ...item,
      provenance: "reference_fixture",
      availabilityStatus: "reference_only",
      catalogVersion: GUIDED_FLORAL_CATALOG_VERSION,
    }).onDuplicateKeyUpdate({ set: {
      commonName: item.commonName,
      category: item.category,
      roleHints: item.roleHints,
      formCapabilities: item.formCapabilities,
      movementCapabilities: item.movementCapabilities,
      surfaceQualities: item.surfaceQualities,
      paletteFamilies: item.paletteFamilies,
      catalogVersion: GUIDED_FLORAL_CATALOG_VERSION,
      updatedAt: new Date(),
    } });
  }
  return db.select().from(botanicalReferenceCatalog).orderBy(asc(botanicalReferenceCatalog.commonName));
}

function parseSignals(story: typeof memoryStories.$inferSelect, essence: typeof essenceProfiles.$inferSelect) {
  const signals = story.designSignals as Record<string, unknown>;
  const readList = (key: string) => Array.isArray(signals[key]) ? signals[key].map(String) : [];
  return {
    paletteDirection: String(signals.paletteDirection ?? essence.paletteDirection),
    floralFormQualities: readList("floralFormQualities"),
    greeneryMotionQualities: readList("greeneryMotionQualities"),
    textureQualities: readList("textureQualities"),
    directionalFlow: String(signals.directionalFlow ?? essence.movement),
    avoidances: Array.from(new Set([...(Array.isArray(essence.avoidances) ? essence.avoidances.map(String) : []), ...readList("avoidances")])),
  };
}

export async function getGuidedFlorals(projectId: number) {
  const db = requireDb(await getDb());
  const roleSet = (await db.select().from(guidedFloralRoleSets).where(eq(guidedFloralRoleSets.projectId, projectId)).orderBy(desc(guidedFloralRoleSets.version)).limit(1))[0];
  if (!roleSet) return { roleSet: null, candidates: [], tray: [], compatibility: null };
  const candidates = await db.select({
    candidate: guidedFloralCandidates,
    catalog: botanicalReferenceCatalog,
  }).from(guidedFloralCandidates).innerJoin(botanicalReferenceCatalog, eq(guidedFloralCandidates.catalogItemId, botanicalReferenceCatalog.id)).where(eq(guidedFloralCandidates.roleSetId, roleSet.id)).orderBy(asc(guidedFloralCandidates.role), asc(guidedFloralCandidates.rank));
  const tray = await db.select({
    selection: guidedWreathTraySelections,
    catalog: botanicalReferenceCatalog,
  }).from(guidedWreathTraySelections).innerJoin(botanicalReferenceCatalog, eq(guidedWreathTraySelections.catalogItemId, botanicalReferenceCatalog.id)).where(eq(guidedWreathTraySelections.projectId, projectId)).orderBy(asc(guidedWreathTraySelections.role));
  const compatibility = (await db.select().from(guidedFloralCompatibilityReports).where(eq(guidedFloralCompatibilityReports.roleSetId, roleSet.id)).limit(1))[0] ?? null;
  return { roleSet, candidates, tray, compatibility };
}

export async function generateGuidedFlorals(input: { projectId: number; workspaceId: number; createdByUserId: number }) {
  const db = requireDb(await getDb());
  const [project, essence, story] = await Promise.all([
    db.select().from(projects).where(and(eq(projects.id, input.projectId), eq(projects.workspaceId, input.workspaceId))).limit(1),
    db.select().from(essenceProfiles).where(eq(essenceProfiles.projectId, input.projectId)).orderBy(desc(essenceProfiles.version)).limit(1),
    db.select().from(memoryStories).where(eq(memoryStories.projectId, input.projectId)).orderBy(desc(memoryStories.version)).limit(1),
  ]);
  if (!project[0]) throw new Error("Guided Wreath project not found in this workspace");
  if (!essence[0] || essence[0].status !== "approved" || !story[0] || story[0].status !== "approved") throw new Error("Approve Your Essence and Memory Story before Guided Florals.");

  const existing = (await db.select().from(guidedFloralRoleSets).where(and(eq(guidedFloralRoleSets.projectId, input.projectId), eq(guidedFloralRoleSets.essenceProfileId, essence[0].id), eq(guidedFloralRoleSets.memoryStoryId, story[0].id))).orderBy(desc(guidedFloralRoleSets.version)).limit(1))[0];
  if (existing) return getGuidedFlorals(input.projectId);

  const [catalog, previous] = await Promise.all([
    ensureReferenceCatalog(),
    db.select({ version: guidedFloralRoleSets.version }).from(guidedFloralRoleSets).where(eq(guidedFloralRoleSets.projectId, input.projectId)).orderBy(desc(guidedFloralRoleSets.version)).limit(1),
  ]);
  const catalogByKey = new Map(catalog.map(item => [item.familyKey, item]));
  const sourceSignals = parseSignals(story[0], essence[0]);
  const draftCandidates = buildGuidedFloralCandidates(sourceSignals);
  const [roleSetResult] = await db.insert(guidedFloralRoleSets).values({
    projectId: input.projectId,
    essenceProfileId: essence[0].id,
    memoryStoryId: story[0].id,
    version: (previous[0]?.version ?? 0) + 1,
    status: "draft",
    catalogVersion: GUIDED_FLORAL_CATALOG_VERSION,
    sourceSignals,
    createdByUserId: input.createdByUserId,
  }).$returningId();
  const roleSetId = roleSetResult?.id;
  if (!roleSetId) throw new Error("Guided Floral role set could not be created");
  const insertable = draftCandidates.map(candidate => {
    const catalogItem = catalogByKey.get(candidate.familyKey);
    if (!catalogItem) throw new Error("A reference catalog candidate is unavailable");
    return { roleSetId, role: candidate.role, catalogItemId: catalogItem.id, rank: candidate.rank, explanation: candidate.explanation, matchEvidence: candidate.matchEvidence, tensionNotes: candidate.tensionNotes };
  });
  await db.insert(guidedFloralCandidates).values(insertable);
  const compatibility = evaluateGuidedFloralCompatibility([]);
  await db.insert(guidedFloralCompatibilityReports).values({ projectId: input.projectId, roleSetId, outcome: compatibility.outcome, checks: compatibility.checks });
  await db.insert(guidedStageStates).values({ projectId: input.projectId, currentStage: "florals", status: "draft", blockReason: "Choose one reference candidate for each role. These selections are not inventory or a Recipe.", updatedByUserId: input.createdByUserId }).onDuplicateKeyUpdate({ set: { currentStage: "florals", status: "draft", blockReason: "Choose one reference candidate for each role. These selections are not inventory or a Recipe.", updatedByUserId: input.createdByUserId, updatedAt: new Date() } });
  await db.insert(memoryThreadEvents).values({ projectId: input.projectId, stage: "florals", sourceType: "guided_floral_role_set", sourceId: roleSetId, sourceVersion: (previous[0]?.version ?? 0) + 1, summary: "Guided Floral roles were opened from the approved Essence and Memory Story.", isDirectSource: false, createdByUserId: input.createdByUserId });
  await db.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, action: "guided_wreath.florals.generated", targetType: "guided_floral_role_set", targetId: String(roleSetId), metadata: { projectId: input.projectId, catalogVersion: GUIDED_FLORAL_CATALOG_VERSION } });
  return getGuidedFlorals(input.projectId);
}

export async function selectGuidedFloralCandidate(input: { projectId: number; workspaceId: number; roleSetId: number; candidateId: number; selectionRationale?: string | null; selectedByUserId: number }) {
  const db = requireDb(await getDb());
  const selected = (await db.select({ candidate: guidedFloralCandidates, roleSet: guidedFloralRoleSets, catalog: botanicalReferenceCatalog }).from(guidedFloralCandidates)
    .innerJoin(guidedFloralRoleSets, eq(guidedFloralCandidates.roleSetId, guidedFloralRoleSets.id))
    .innerJoin(botanicalReferenceCatalog, eq(guidedFloralCandidates.catalogItemId, botanicalReferenceCatalog.id))
    .where(and(eq(guidedFloralCandidates.id, input.candidateId), eq(guidedFloralRoleSets.id, input.roleSetId), eq(guidedFloralRoleSets.projectId, input.projectId))).limit(1))[0];
  if (!selected) throw new Error("Floral candidate not found in this project");
  if (selected.catalog.provenance !== "reference_fixture" && selected.catalog.provenance !== "vetted") throw new Error("Floral candidate does not have approved reference provenance");

  await db.transaction(async tx => {
    await tx.insert(guidedWreathTraySelections).values({ projectId: input.projectId, roleSetId: input.roleSetId, role: selected.candidate.role, candidateId: selected.candidate.id, catalogItemId: selected.catalog.id, selectionRationale: input.selectionRationale?.trim() || null, selectedByUserId: input.selectedByUserId }).onDuplicateKeyUpdate({ set: { roleSetId: input.roleSetId, candidateId: selected.candidate.id, catalogItemId: selected.catalog.id, selectionRationale: input.selectionRationale?.trim() || null, selectedByUserId: input.selectedByUserId, updatedAt: new Date() } });
    const tray = await tx.select({ selection: guidedWreathTraySelections, catalog: botanicalReferenceCatalog }).from(guidedWreathTraySelections).innerJoin(botanicalReferenceCatalog, eq(guidedWreathTraySelections.catalogItemId, botanicalReferenceCatalog.id)).where(eq(guidedWreathTraySelections.projectId, input.projectId));
    const compatibility = evaluateGuidedFloralCompatibility(tray.map(item => ({ role: item.selection.role as GuidedFloralRole, familyKey: item.catalog.familyKey, provenance: item.catalog.provenance })));
    await tx.insert(guidedFloralCompatibilityReports).values({ projectId: input.projectId, roleSetId: input.roleSetId, outcome: compatibility.outcome, checks: compatibility.checks }).onDuplicateKeyUpdate({ set: { outcome: compatibility.outcome, checks: compatibility.checks, updatedAt: new Date() } });
    const complete = compatibility.outcome !== "blocked";
    await tx.update(guidedFloralRoleSets).set({ status: complete ? "complete" : "draft", updatedAt: new Date() }).where(eq(guidedFloralRoleSets.id, input.roleSetId));
    await tx.insert(guidedStageStates).values({ projectId: input.projectId, currentStage: complete ? "recipe" : "florals", status: "blocked", blockReason: complete ? "Your Wreath Tray is ready. Recipe lock is the next reviewed product checkpoint." : "Choose one reference candidate for each required role before Recipe can be reviewed.", updatedByUserId: input.selectedByUserId }).onDuplicateKeyUpdate({ set: { currentStage: complete ? "recipe" : "florals", status: "blocked", blockReason: complete ? "Your Wreath Tray is ready. Recipe lock is the next reviewed product checkpoint." : "Choose one reference candidate for each required role before Recipe can be reviewed.", updatedByUserId: input.selectedByUserId, updatedAt: new Date() } });
    await tx.insert(memoryThreadEvents).values({ projectId: input.projectId, stage: "florals", sourceType: "guided_wreath_tray_selection", sourceId: selected.candidate.id, sourceVersion: selected.roleSet.version, summary: `${selected.catalog.commonName} selected for ${selected.candidate.role.replaceAll("_", " ")}.`, isDirectSource: false, createdByUserId: input.selectedByUserId });
    await tx.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.selectedByUserId, action: "guided_wreath.florals.selected", targetType: "guided_floral_candidate", targetId: String(selected.candidate.id), metadata: { projectId: input.projectId, role: selected.candidate.role, catalogFamily: selected.catalog.familyKey, compatibilityOutcome: compatibility.outcome } });
  });
  return getGuidedFlorals(input.projectId);
}
