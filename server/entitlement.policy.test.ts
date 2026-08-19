import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const databaseMocks = vi.hoisted(() => ({
  createProject: vi.fn(),
  getWorkspaceMembership: vi.fn(),
  listWorkspaceEntitlements: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), ...databaseMocks }));
import { appRouter } from "./routers";

const context = (): TrpcContext => ({
  user: { id: 51, openId: "entitlement-test", name: "Entitlement Test", email: "entitlement@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {} as TrpcContext["req"], res: {} as TrpcContext["res"],
});
const managerMembership = { workspaceId: 12, workspaceSlug: "entitled", workspaceName: "Entitled", workspaceKind: "organization" as const, workspaceArchived: false, membershipId: 6, role: "member" as const, status: "active" as const };

describe("workspace entitlement enforcement", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks project creation when an explicit capability record is disabled", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(managerMembership);
    databaseMocks.listWorkspaceEntitlements.mockResolvedValue([{ capability: "project.create", isEnabled: false }]);

    await expect(appRouter.createCaller(context()).project.create({ workspaceId: 12, name: "Blocked project" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(databaseMocks.createProject).not.toHaveBeenCalled();
  });

  it("allows the default policy when no explicit capability record exists", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(managerMembership);
    databaseMocks.listWorkspaceEntitlements.mockResolvedValue([]);
    databaseMocks.createProject.mockResolvedValue({ id: 73, workspaceId: 12, name: "Default project" });

    await expect(appRouter.createCaller(context()).project.create({ workspaceId: 12, name: "Default project" })).resolves.toMatchObject({ id: 73 });
    expect(databaseMocks.createProject).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 12, createdByUserId: 51 }));
  });
});
