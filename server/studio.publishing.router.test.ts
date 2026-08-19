import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const databaseMocks = vi.hoisted(() => ({
  getWorkspaceMembership: vi.fn(),
  queueDeliveryPublishingHandoff: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, ...databaseMocks };
});

import { appRouter } from "./routers";

function createContext(): TrpcContext {
  return { user: { id: 42, openId: "studio-test-user", name: "Studio Test User", email: "studio@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const activeMembership = (role: "member" | "viewer") => ({ workspaceId: 9, workspaceSlug: "studio-test", workspaceName: "Studio test", workspaceKind: "organization" as const, workspaceArchived: false, membershipId: 7, role, status: "active" as const });

describe("Studio publishing handoff router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queues a provider-neutral handoff for a ready delivery when the caller can manage the workspace", async () => {
    const result = { outcome: "queued" as const, delivery: { id: 11, status: "ready" }, job: { id: 57, jobType: "studio.provider_handoff" } };
    databaseMocks.getWorkspaceMembership.mockResolvedValue(activeMembership("member"));
    databaseMocks.queueDeliveryPublishingHandoff.mockResolvedValue(result);

    await expect(appRouter.createCaller(createContext()).studio.queuePublishingHandoff({ workspaceId: 9, deliveryId: 11 })).resolves.toEqual({ delivery: result.delivery, job: result.job });
    expect(databaseMocks.queueDeliveryPublishingHandoff).toHaveBeenCalledWith({ workspaceId: 9, deliveryId: 11, actorUserId: 42 });
  });

  it("rejects a viewer before an external-provider handoff record can be queued", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(activeMembership("viewer"));
    await expect(appRouter.createCaller(createContext()).studio.queuePublishingHandoff({ workspaceId: 9, deliveryId: 11 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(databaseMocks.queueDeliveryPublishingHandoff).not.toHaveBeenCalled();
  });
});
