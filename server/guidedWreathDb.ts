import { and, asc, desc, eq } from "drizzle-orm";
import {
  auditLogs,
  essenceProfiles,
  guidedStageStates,
  memoryConsents,
  memoryEntries,
  memoryStories,
  memoryThreadEvents,
  projects,
  stageApprovals,
} from "../drizzle/schema";
import { createProject, getDb, type WorkspaceRole } from "./db";

export type GuidedWreathStage = "memory" | "essence" | "story" | "florals" | "recipe" | "blueprint" | "wreath" | "outcome";
export type MemoryVisibility = "private" | "private_story_shareable_wreath" | "private_link_lookbook" | "anonymous_gallery" | "public_first_name" | "fully_public";

function requireDb<T>(db: T | null): T {
  if (!db) throw new Error("Database is unavailable");
  return db;
}

export async function getGuidedProjectForWorkspace(projectId: number, workspaceId: number) {
  const db = requireDb(await getDb());
  return (await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId))).limit(1))[0];
}

export async function startGuidedWreathProject(input: { workspaceId: number; name: string; createdByUserId: number }) {
  const project = await createProject({ workspaceId: input.workspaceId, name: input.name, description: "Guided Wreath Creation project", createdByUserId: input.createdByUserId });
  if (!project) throw new Error("Guided Wreath project could not be created");
  const db = requireDb(await getDb());
  await db.insert(guidedStageStates).values({ projectId: project.id, currentStage: "memory", status: "draft", updatedByUserId: input.createdByUserId });
  await db.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, action: "guided_wreath.project.started", targetType: "project", targetId: String(project.id) });
  return project;
}

export async function getGuidedWreathJourney(projectId: number) {
  const db = requireDb(await getDb());
  const [stageState, memory, essence, story, consents, thread] = await Promise.all([
    db.select().from(guidedStageStates).where(eq(guidedStageStates.projectId, projectId)).limit(1),
    db.select().from(memoryEntries).where(eq(memoryEntries.projectId, projectId)).orderBy(desc(memoryEntries.version)).limit(1),
    db.select().from(essenceProfiles).where(eq(essenceProfiles.projectId, projectId)).orderBy(desc(essenceProfiles.version)).limit(1),
    db.select().from(memoryStories).where(eq(memoryStories.projectId, projectId)).orderBy(desc(memoryStories.version)).limit(1),
    db.select().from(memoryConsents).where(eq(memoryConsents.projectId, projectId)),
    db.select().from(memoryThreadEvents).where(eq(memoryThreadEvents.projectId, projectId)).orderBy(asc(memoryThreadEvents.createdAt)),
  ]);
  return { stageState: stageState[0] ?? null, memory: memory[0] ?? null, essence: essence[0] ?? null, story: story[0] ?? null, consents, thread };
}

export async function saveGuidedMemory(input: { projectId: number; body: string; visibility: MemoryVisibility; createdByUserId: number; workspaceId: number }) {
  const db = requireDb(await getDb());
  return db.transaction(async tx => {
    const previous = await tx.select({ version: memoryEntries.version }).from(memoryEntries).where(eq(memoryEntries.projectId, input.projectId)).orderBy(desc(memoryEntries.version)).limit(1);
    const version = (previous[0]?.version ?? 0) + 1;
    const [result] = await tx.insert(memoryEntries).values({ projectId: input.projectId, version, body: input.body.trim(), visibility: input.visibility, createdByUserId: input.createdByUserId }).$returningId();
    const memoryId = result?.id;
    if (!memoryId) throw new Error("Memory could not be saved");
    await tx.insert(memoryConsents).values({ projectId: input.projectId, consentType: "memory", isGranted: true, visibility: input.visibility, decidedByUserId: input.createdByUserId }).onDuplicateKeyUpdate({ set: { isGranted: true, visibility: input.visibility, decidedByUserId: input.createdByUserId, decidedAt: new Date(), revokedAt: null } });
    await tx.insert(guidedStageStates).values({ projectId: input.projectId, currentStage: "essence", status: "blocked", blockReason: "Create and approve Your Essence before continuing.", updatedByUserId: input.createdByUserId }).onDuplicateKeyUpdate({ set: { currentStage: "essence", status: "blocked", blockReason: "Create and approve Your Essence before continuing.", updatedByUserId: input.createdByUserId, updatedAt: new Date() } });
    await tx.insert(memoryThreadEvents).values({ projectId: input.projectId, stage: "memory", sourceType: "memory_entry", sourceId: memoryId, sourceVersion: version, summary: "Original memory saved as private source material.", isDirectSource: true, createdByUserId: input.createdByUserId });
    await tx.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, action: "guided_wreath.memory.saved", targetType: "memory_entry", targetId: String(memoryId), metadata: { projectId: input.projectId, version, visibility: input.visibility } });
    return (await tx.select().from(memoryEntries).where(eq(memoryEntries.id, memoryId)).limit(1))[0];
  });
}

export async function saveGroundedDraft(input: {
  projectId: number;
  memoryEntryId: number;
  createdByUserId: number;
  workspaceId: number;
  generationSource: "model" | "fallback";
  draft: {
    essence: { emotionalCenter: string; atmosphere: string; movement: string; visualTension: string; paletteDirection: string; expression: string; avoidances: string[] };
    story: { excerpt: string; body: string; designSignals: Record<string, unknown> };
    sourceDetails: string[];
    unsupportedClaims: string[];
  };
}) {
  const db = requireDb(await getDb());
  return db.transaction(async tx => {
    const previousEssence = await tx.select({ version: essenceProfiles.version }).from(essenceProfiles).where(eq(essenceProfiles.projectId, input.projectId)).orderBy(desc(essenceProfiles.version)).limit(1);
    const essenceVersion = (previousEssence[0]?.version ?? 0) + 1;
    const grounding = { directDetails: input.draft.sourceDetails, interpretation: "Interpretive fields are offered for client review and are not new biography.", verified: input.draft.sourceDetails.length > 0 };
    const [essenceResult] = await tx.insert(essenceProfiles).values({ projectId: input.projectId, memoryEntryId: input.memoryEntryId, version: essenceVersion, emotionalCenter: input.draft.essence.emotionalCenter, atmosphere: input.draft.essence.atmosphere, movement: input.draft.essence.movement, visualTension: input.draft.essence.visualTension, paletteDirection: input.draft.essence.paletteDirection, expression: input.draft.essence.expression, avoidances: input.draft.essence.avoidances, sourceGrounding: grounding, unsupportedClaims: input.draft.unsupportedClaims, generationSource: input.generationSource, createdByUserId: input.createdByUserId }).$returningId();
    const essenceId = essenceResult?.id;
    if (!essenceId) throw new Error("Essence profile could not be saved");
    const previousStory = await tx.select({ version: memoryStories.version }).from(memoryStories).where(eq(memoryStories.projectId, input.projectId)).orderBy(desc(memoryStories.version)).limit(1);
    const storyVersion = (previousStory[0]?.version ?? 0) + 1;
    const [storyResult] = await tx.insert(memoryStories).values({ projectId: input.projectId, memoryEntryId: input.memoryEntryId, essenceProfileId: essenceId, version: storyVersion, excerpt: input.draft.story.excerpt, body: input.draft.story.body, designSignals: input.draft.story.designSignals, sourceGrounding: grounding, unsupportedClaims: input.draft.unsupportedClaims, generationSource: input.generationSource, createdByUserId: input.createdByUserId }).$returningId();
    const storyId = storyResult?.id;
    if (!storyId) throw new Error("Memory Story could not be saved");
    const blocked = input.draft.unsupportedClaims.length > 0;
    await tx.insert(guidedStageStates).values({ projectId: input.projectId, currentStage: "essence", status: blocked ? "blocked" : "draft", blockReason: blocked ? "Review flagged grounding details before approving Your Essence." : null, updatedByUserId: input.createdByUserId }).onDuplicateKeyUpdate({ set: { currentStage: "essence", status: blocked ? "blocked" : "draft", blockReason: blocked ? "Review flagged grounding details before approving Your Essence." : null, updatedByUserId: input.createdByUserId, updatedAt: new Date() } });
    await tx.insert(memoryThreadEvents).values([
      { projectId: input.projectId, stage: "essence", sourceType: "essence_profile", sourceId: essenceId, sourceVersion: essenceVersion, summary: "Your Essence draft created from the saved memory for review.", isDirectSource: false, createdByUserId: input.createdByUserId },
      { projectId: input.projectId, stage: "story", sourceType: "memory_story", sourceId: storyId, sourceVersion: storyVersion, summary: "Memory Story and Design Signals draft created for review.", isDirectSource: false, createdByUserId: input.createdByUserId },
    ]);
    await tx.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, action: "guided_wreath.draft.generated", targetType: "essence_profile", targetId: String(essenceId), metadata: { projectId: input.projectId, generationSource: input.generationSource, hasUnsupportedClaims: blocked } });
    return { essence: (await tx.select().from(essenceProfiles).where(eq(essenceProfiles.id, essenceId)).limit(1))[0], story: (await tx.select().from(memoryStories).where(eq(memoryStories.id, storyId)).limit(1))[0] };
  });
}

export async function decideGuidedArtifact(input: { projectId: number; stage: "essence" | "story"; entityId: number; decision: "approved" | "revision_requested"; note?: string | null; decidedByUserId: number; workspaceId: number }) {
  const db = requireDb(await getDb());
  return db.transaction(async tx => {
    const isEssence = input.stage === "essence";
    const entity = isEssence
      ? (await tx.select().from(essenceProfiles).where(and(eq(essenceProfiles.id, input.entityId), eq(essenceProfiles.projectId, input.projectId))).limit(1))[0]
      : (await tx.select().from(memoryStories).where(and(eq(memoryStories.id, input.entityId), eq(memoryStories.projectId, input.projectId))).limit(1))[0];
    if (!entity) return undefined;
    if (input.decision === "approved" && Array.isArray(entity.unsupportedClaims) && entity.unsupportedClaims.length > 0) throw new Error("Resolve or revise flagged grounding details before approval");
    const approved = input.decision === "approved";
    if (isEssence) await tx.update(essenceProfiles).set({ status: approved ? "approved" : "needs_revision", approvedAt: approved ? new Date() : null }).where(eq(essenceProfiles.id, input.entityId));
    else await tx.update(memoryStories).set({ status: approved ? "approved" : "needs_revision", approvedAt: approved ? new Date() : null }).where(eq(memoryStories.id, input.entityId));
    await tx.insert(stageApprovals).values({ projectId: input.projectId, stage: input.stage, entityType: isEssence ? "essence_profile" : "memory_story", entityId: input.entityId, entityVersion: entity.version, decision: input.decision, note: input.note ?? null, decidedByUserId: input.decidedByUserId });
    const nextStage: GuidedWreathStage = approved ? (isEssence ? "story" : "florals") : input.stage;
    const blockReason = approved && isEssence ? "Review and approve the Memory Story before Guided Florals." : approved ? "Guided Florals is the next reviewed product checkpoint; no inventory candidates are shown yet." : "Revise this draft before continuing.";
    await tx.insert(guidedStageStates).values({ projectId: input.projectId, currentStage: nextStage, status: "blocked", blockReason, updatedByUserId: input.decidedByUserId }).onDuplicateKeyUpdate({ set: { currentStage: nextStage, status: "blocked", blockReason, updatedByUserId: input.decidedByUserId, updatedAt: new Date() } });
    await tx.insert(auditLogs).values({ workspaceId: input.workspaceId, actorUserId: input.decidedByUserId, action: `guided_wreath.${input.stage}.${input.decision}`, targetType: isEssence ? "essence_profile" : "memory_story", targetId: String(input.entityId), metadata: { projectId: input.projectId, version: entity.version } });
    return { ...entity, status: approved ? "approved" : "needs_revision" };
  });
}

export function canOpenGuidedWreath(role: WorkspaceRole) {
  return role !== "viewer";
}
