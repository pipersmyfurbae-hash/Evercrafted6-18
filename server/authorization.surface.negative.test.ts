import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const databaseMocks = vi.hoisted(() => ({
  createReviewRequest: vi.fn(),
  createWorkspaceInvitation: vi.fn(),
  getWorkspaceMembership: vi.fn(),
  listPlatformWorkspaces: vi.fn(),
  writeAuditLog: vi.fn(),
}));
const storageMocks = vi.hoisted(() => ({ storagePut: vi.fn() }));

vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), ...databaseMocks }));
vi.mock("./storage", () => storageMocks);
import { appRouter } from "./routers";

const context = (role: "user" | "admin" = "user"): TrpcContext => ({
  user: { id: 4, openId: `negative-${role}`, name: "Negative path", email: "negative@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {} as TrpcContext["req"], res: {} as TrpcContext["res"],
});
const membership = (role: "viewer" | "client") => ({ workspaceId: 5, workspaceSlug: "negative", workspaceName: "Negative", workspaceKind: "organization" as const, workspaceArchived: false, membershipId: 6, role, status: "active" as const });

describe("cross-surface negative authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects viewer asset upload and Studio review before storage or workflow repositories run", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(membership("viewer"));
    await expect(appRouter.createCaller(context()).asset.uploadBase64({ workspaceId: 5, name: "blocked.txt", mediaType: "text/plain", base64: Buffer.from("blocked").toString("base64") })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context()).studio.requestReview({ workspaceId: 5, projectId: 3 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(storageMocks.storagePut).not.toHaveBeenCalled();
    expect(databaseMocks.createReviewRequest).not.toHaveBeenCalled();
  });

  it("rejects a client member before workspace invitation administration writes", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(membership("client"));
    await expect(appRouter.createCaller(context()).workspace.invite({ workspaceId: 5, email: "invitee@example.com", role: "viewer" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(databaseMocks.createWorkspaceInvitation).not.toHaveBeenCalled();
  });

  it("rejects a non-administrator from tenant overview and audited support access before repository actions", async () => {
    await expect(appRouter.createCaller(context()).admin.listWorkspaces()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context()).admin.recordSupportAccess({ workspaceId: 5, reason: "Attempting restricted support access" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(databaseMocks.listPlatformWorkspaces).not.toHaveBeenCalled();
    expect(databaseMocks.writeAuditLog).not.toHaveBeenCalled();
  });
});
