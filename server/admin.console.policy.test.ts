import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const databaseMocks = vi.hoisted(() => ({
  listPlatformWorkspaces: vi.fn(),
  writeAuditLog: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), ...databaseMocks }));
import { appRouter } from "./routers";

const context = (role: "admin" | "user"): TrpcContext => ({
  user: { id: role === "admin" ? 8 : 9, openId: `${role}-access`, name: `${role} access`, email: `${role}@example.com`, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {} as TrpcContext["req"], res: {} as TrpcContext["res"],
});

describe("restricted administration console", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a non-administrator before tenant overview data is queried", async () => {
    await expect(appRouter.createCaller(context("user")).admin.listWorkspaces()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(databaseMocks.listPlatformWorkspaces).not.toHaveBeenCalled();
  });

  it("returns non-secret integration readiness only to administrators", async () => {
    await expect(appRouter.createCaller(context("user")).admin.integrationHealth()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context("admin")).admin.integrationHealth()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "publishing", status: "unconfigured" }),
      expect.objectContaining({ key: "recovery", status: "ready" }),
    ]));
  });

  it("allows an administrator to record a scoped support-access reason in the audit log", async () => {
    databaseMocks.writeAuditLog.mockResolvedValue(undefined);
    await expect(appRouter.createCaller(context("admin")).admin.recordSupportAccess({ workspaceId: 21, reason: "Investigating a member-reported delivery status issue" })).resolves.toEqual({ recorded: true });
    expect(databaseMocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 21, actorUserId: 8, action: "support.access.requested", metadata: { reason: "Investigating a member-reported delivery status issue" } }));
  });
});
