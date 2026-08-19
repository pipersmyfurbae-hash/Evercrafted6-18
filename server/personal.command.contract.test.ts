import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const databaseMocks = vi.hoisted(() => ({
  createProject: vi.fn(),
  ensurePersonalWorkspace: vi.fn(),
  getBackgroundJobHealth: vi.fn(),
  incrementWorkspaceUsage: vi.fn(),
  listWorkspaceEntitlements: vi.fn(),
  listWorkspaceSubscriptions: vi.fn(),
  listPlatformIntegrationControls: vi.fn(),
  listPlatformWorkspaces: vi.fn(),
  listProjectsForWorkspace: vi.fn(),
  listRecentPlatformActivity: vi.fn(),
  updatePlatformIntegrationControl: vi.fn(),
  writeAuditLog: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), ...databaseMocks }));
vi.mock("./_core/env", async importOriginal => ({ ...(await importOriginal<typeof import("./_core/env")>()), ENV: { ownerOpenId: "owner-open-id" } }));
import { appRouter } from "./routers";

const context = (): TrpcContext => ({
  user: { id: 1, openId: "owner-open-id", name: "Platform Owner", email: "owner@example.com", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {} as TrpcContext["req"], res: {} as TrpcContext["res"],
});

describe("Personal command overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseMocks.listWorkspaceEntitlements.mockResolvedValue([]);
    databaseMocks.listWorkspaceSubscriptions.mockResolvedValue([]);
    databaseMocks.listPlatformIntegrationControls.mockResolvedValue([{ key: "publishing_provider", label: "Publishing provider", detail: "Unconfigured", status: "unconfigured", isEnabled: false, reviewNote: null, reviewedAt: null }]);
  });

  it("returns only the owner's personal-workspace projects alongside provider-neutral readiness state", async () => {
    databaseMocks.ensurePersonalWorkspace.mockResolvedValue({ id: 5, name: "Platform Owner's space", slug: "me-1", kind: "personal" });
    databaseMocks.listProjectsForWorkspace.mockResolvedValue([{ id: 91, workspaceId: 5, name: "Private direction" }]);
    databaseMocks.listPlatformWorkspaces.mockResolvedValue([]);
    databaseMocks.listRecentPlatformActivity.mockResolvedValue([]);
    databaseMocks.getBackgroundJobHealth.mockResolvedValue({ counts: {}, retryingJobs: 0, deadLetterJobs: 0, heavyMediaEscalationJobIds: [] });

    const result = await appRouter.createCaller(context()).personal.overview();

    expect(databaseMocks.listProjectsForWorkspace).toHaveBeenCalledWith(5);
    expect(result.privateProjects).toEqual([{ id: 91, workspaceId: 5, name: "Private direction" }]);
    expect(result.integrationReadiness).toEqual(expect.arrayContaining([expect.objectContaining({ key: "publishing_provider", status: "unconfigured" })]));
  });

  it("creates a private project only inside the owner personal workspace and records governed side effects", async () => {
    databaseMocks.ensurePersonalWorkspace.mockResolvedValue({ id: 5, name: "Platform Owner's space", slug: "me-1", kind: "personal" });
    databaseMocks.createProject.mockResolvedValue({ id: 92, workspaceId: 5, name: "Private build" });
    databaseMocks.incrementWorkspaceUsage.mockResolvedValue({ id: 3, metric: "project.create", quantity: 1 });
    databaseMocks.writeAuditLog.mockResolvedValue(undefined);

    await expect(appRouter.createCaller(context()).personal.createPrivateProject({ name: "Private build", description: "Owner-only direction" })).resolves.toMatchObject({ id: 92, workspaceId: 5 });
    expect(databaseMocks.createProject).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 5, createdByUserId: 1, name: "Private build" }));
    expect(databaseMocks.incrementWorkspaceUsage).toHaveBeenCalledWith({ workspaceId: 5, metric: "project.create" });
    expect(databaseMocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 5, actorUserId: 1, action: "personal.project.created", targetType: "project", targetId: "92" }));
  });

  it("records a provider-neutral integration readiness review as an owner audit event", async () => {
    databaseMocks.writeAuditLog.mockResolvedValue(undefined);
    await expect(appRouter.createCaller(context()).personal.recordIntegrationReview({ integrationKey: "job_recovery", note: "Reviewed deferred recovery cadence." })).resolves.toEqual({ integrationKey: "job_recovery", recorded: true });
    expect(databaseMocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: 1, action: "personal.integration.reviewed", targetType: "integration", targetId: "job_recovery", metadata: { note: "Reviewed deferred recovery cadence." } }));
  });

  it("persists non-secret integration status and enablement intent with an exact-owner audit event", async () => {
    databaseMocks.updatePlatformIntegrationControl.mockResolvedValue({ id: 4, integrationKey: "job_recovery", status: "ready", isEnabled: true, reviewNote: "Recovery endpoint reviewed and accepted." });
    databaseMocks.writeAuditLog.mockResolvedValue(undefined);
    await expect(appRouter.createCaller(context()).personal.updateIntegrationControl({ integrationKey: "job_recovery", status: "ready", isEnabled: true, reviewNote: "Recovery endpoint reviewed and accepted." })).resolves.toMatchObject({ id: 4, status: "ready", isEnabled: true });
    expect(databaseMocks.updatePlatformIntegrationControl).toHaveBeenCalledWith({ integrationKey: "job_recovery", status: "ready", isEnabled: true, reviewNote: "Recovery endpoint reviewed and accepted.", reviewedByUserId: 1 });
    expect(databaseMocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: 1, action: "personal.integration.control_updated", targetType: "integration", targetId: "job_recovery", metadata: expect.objectContaining({ status: "ready", isEnabled: true }) }));
  });
});
