import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const databaseMocks = vi.hoisted(() => ({ getWorkspaceMembership: vi.fn(), getAssetForWorkspace: vi.fn(), listAssetVersionsForWorkspace: vi.fn(), createAssetVersion: vi.fn() }));
const storageMocks = vi.hoisted(() => ({ storagePut: vi.fn() }));
vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), ...databaseMocks }));
vi.mock("./storage", () => storageMocks);
import { appRouter } from "./routers";

const context = (): TrpcContext => ({ user: { id: 42, openId: "asset-version-test", name: "Asset tester", email: "asset@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
const membership = (role: "member" | "viewer") => ({ workspaceId: 7, workspaceSlug: "test", workspaceName: "Test", workspaceKind: "organization" as const, workspaceArchived: false, membershipId: 1, role, status: "active" as const });

describe("asset version router", () => {
  beforeEach(() => vi.clearAllMocks());
  it("creates a new version only after workspace-management authorization and stores it through the governed adapter", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(membership("member"));
    databaseMocks.getAssetForWorkspace.mockResolvedValue({ id: 5, workspaceId: 7, projectId: 3 });
    storageMocks.storagePut.mockResolvedValue({ key: "workspaces/7/assets/5/v2-file.txt", url: "/manus-storage/test" });
    databaseMocks.createAssetVersion.mockResolvedValue({ id: 5, storageKey: "workspaces/7/assets/5/v2-file.txt" });
    await expect(appRouter.createCaller(context()).asset.uploadVersionBase64({ workspaceId: 7, assetId: 5, name: "file.txt", mediaType: "text/plain", base64: Buffer.from("revision").toString("base64") })).resolves.toMatchObject({ id: 5 });
    expect(databaseMocks.createAssetVersion).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 7, assetId: 5, createdByUserId: 42 }));
  });
  it("blocks viewer version uploads before storage is called", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(membership("viewer"));
    await expect(appRouter.createCaller(context()).asset.uploadVersionBase64({ workspaceId: 7, assetId: 5, name: "file.txt", mediaType: "text/plain", base64: Buffer.from("revision").toString("base64") })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(storageMocks.storagePut).not.toHaveBeenCalled();
  });
});
