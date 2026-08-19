import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const databaseMocks = vi.hoisted(() => ({
  createProject: vi.fn(),
  getWorkspaceMembership: vi.fn(),
  getWorkspaceUsageMetric: vi.fn(),
  incrementWorkspaceUsage: vi.fn(),
  listWorkspaceEntitlements: vi.fn(),
  listWorkspaceSubscriptions: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), ...databaseMocks }));
import { appRouter } from "./routers";

const context = (): TrpcContext => ({
  user: { id: 51, openId: "entitlement-test", name: "Entitlement Test", email: "entitlement@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {} as TrpcContext["req"], res: {} as TrpcContext["res"],
});
const managerMembership = { workspaceId: 12, workspaceSlug: "entitled", workspaceName: "Entitled", workspaceKind: "organization" as const, workspaceArchived: false, membershipId: 6, role: "member" as const, status: "active" as const };

describe("workspace entitlement enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseMocks.listWorkspaceSubscriptions.mockResolvedValue([]);
    databaseMocks.getWorkspaceUsageMetric.mockResolvedValue(undefined);
  });

  it("blocks project creation when an explicit capability record is disabled", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(managerMembership);
    databaseMocks.listWorkspaceEntitlements.mockResolvedValue([{ capability: "project.create", isEnabled: false }]);

    await expect(appRouter.createCaller(context()).project.create({ workspaceId: 12, name: "Blocked project" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(databaseMocks.createProject).not.toHaveBeenCalled();
    expect(databaseMocks.incrementWorkspaceUsage).not.toHaveBeenCalled();
  });

  it("allows the default policy when no explicit capability record exists", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(managerMembership);
    databaseMocks.listWorkspaceEntitlements.mockResolvedValue([]);
    databaseMocks.createProject.mockResolvedValue({ id: 73, workspaceId: 12, name: "Default project" });

    await expect(appRouter.createCaller(context()).project.create({ workspaceId: 12, name: "Default project" })).resolves.toMatchObject({ id: 73 });
    expect(databaseMocks.createProject).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 12, createdByUserId: 51 }));
    expect(databaseMocks.incrementWorkspaceUsage).toHaveBeenCalledWith({ workspaceId: 12, metric: "project.create" });
  });

  it("blocks protected creation when the current subscription lifecycle is ineligible", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(managerMembership);
    databaseMocks.listWorkspaceEntitlements.mockResolvedValue([]);
    databaseMocks.listWorkspaceSubscriptions.mockResolvedValue([{ status: "paused" }]);

    await expect(appRouter.createCaller(context()).project.create({ workspaceId: 12, name: "Paused lifecycle project" })).rejects.toMatchObject({ code: "FORBIDDEN", message: expect.stringContaining("subscription status") });
    expect(databaseMocks.createProject).not.toHaveBeenCalled();
    expect(databaseMocks.incrementWorkspaceUsage).not.toHaveBeenCalled();
  });

  it("blocks protected creation when an explicit capability usage limit is exhausted", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(managerMembership);
    databaseMocks.listWorkspaceEntitlements.mockResolvedValue([{ capability: "project.create", isEnabled: true, usageLimit: 1 }]);
    databaseMocks.getWorkspaceUsageMetric.mockResolvedValue({ quantity: 1 });

    await expect(appRouter.createCaller(context()).project.create({ workspaceId: 12, name: "Over limit project" })).rejects.toMatchObject({ code: "FORBIDDEN", message: expect.stringContaining("usage limit") });
    expect(databaseMocks.createProject).not.toHaveBeenCalled();
    expect(databaseMocks.incrementWorkspaceUsage).not.toHaveBeenCalled();
  });
});
