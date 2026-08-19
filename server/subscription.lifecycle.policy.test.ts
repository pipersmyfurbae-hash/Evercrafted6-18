import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const databaseMocks = vi.hoisted(() => ({
  assignWorkspaceSubscription: vi.fn(),
  getWorkspaceCommercialOverview: vi.fn(),
  getWorkspaceMembership: vi.fn(),
  writeAuditLog: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), ...databaseMocks }));
import { appRouter } from "./routers";

const context = (role: "admin" | "user", userId = 7): TrpcContext => ({
  user: { id: userId, openId: `${role}-${userId}`, name: "Test user", email: "test@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {} as TrpcContext["req"], res: {} as TrpcContext["res"],
});

describe("subscription lifecycle and commercial overview policy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns commercial state only after an active workspace membership check", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue({ role: "member", status: "active", workspaceArchived: false });
    databaseMocks.getWorkspaceCommercialOverview.mockResolvedValue({ subscriptions: [], entitlements: [], usage: [], billingProvider: "unconfigured" });
    await expect(appRouter.createCaller(context("user")).workspace.commercialOverview({ workspaceId: 41 })).resolves.toMatchObject({ billingProvider: "unconfigured", usage: [] });
    expect(databaseMocks.getWorkspaceCommercialOverview).toHaveBeenCalledWith(41);
  });

  it("rejects commercial state before the repository is queried when membership is absent", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(undefined);
    await expect(appRouter.createCaller(context("user")).workspace.commercialOverview({ workspaceId: 41 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(databaseMocks.getWorkspaceCommercialOverview).not.toHaveBeenCalled();
  });

  it("allows only administrators to assign a provider-neutral subscription lifecycle record and audits the action", async () => {
    databaseMocks.assignWorkspaceSubscription.mockResolvedValue({ id: 12, workspaceId: 41, planId: 3, status: "trialing" });
    await expect(appRouter.createCaller(context("admin", 3)).admin.assignWorkspaceSubscription({ workspaceId: 41, planId: 3, status: "trialing" })).resolves.toMatchObject({ id: 12, planId: 3 });
    expect(databaseMocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 41, actorUserId: 3, action: "admin.subscription.assigned", metadata: { planId: 3, status: "trialing" } }));
    await expect(appRouter.createCaller(context("user")).admin.assignWorkspaceSubscription({ workspaceId: 41, planId: 3, status: "trialing" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
