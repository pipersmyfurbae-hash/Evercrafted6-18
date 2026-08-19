import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const databaseMocks = vi.hoisted(() => ({
  ensurePersonalWorkspace: vi.fn(),
  getBackgroundJobHealth: vi.fn(),
  listPlatformWorkspaces: vi.fn(),
  listProjectsForWorkspace: vi.fn(),
  listRecentPlatformActivity: vi.fn(),
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
  beforeEach(() => vi.clearAllMocks());

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
});
