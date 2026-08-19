import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseMocks = vi.hoisted(() => ({
  getWorkspaceMembership: vi.fn(),
  getProjectForWorkspace: vi.fn(),
  getWorkspaceUsageMetric: vi.fn(),
  isSubscriptionStatusEligible: vi.fn(),
  isWorkspaceCapabilityEnabled: vi.fn(),
  listWorkspaceEntitlements: vi.fn(),
  listWorkspaceSubscriptions: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), ...databaseMocks }));

import { authorizeWorkspaceOperation } from "./security";

const member = { workspaceId: 7, workspaceSlug: "seven", workspaceName: "Seven", workspaceKind: "organization" as const, workspaceArchived: false, membershipId: 1, role: "member" as const, status: "active" as const };

describe("central workspace operation guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseMocks.getWorkspaceMembership.mockResolvedValue(member);
    databaseMocks.getProjectForWorkspace.mockResolvedValue({ id: 11, workspaceId: 7 });
    databaseMocks.listWorkspaceEntitlements.mockResolvedValue([]);
    databaseMocks.listWorkspaceSubscriptions.mockResolvedValue([]);
    databaseMocks.isWorkspaceCapabilityEnabled.mockReturnValue(true);
    databaseMocks.isSubscriptionStatusEligible.mockReturnValue(true);
  });

  it("returns active membership and same-workspace project only after all requested scope checks pass", async () => {
    await expect(authorizeWorkspaceOperation({ userId: 1, workspaceId: 7, projectId: 11, predicate: role => role === "member", capability: "asset.upload" })).resolves.toMatchObject({ membership: { role: "member" }, project: { id: 11, workspaceId: 7 } });
    expect(databaseMocks.getProjectForWorkspace).toHaveBeenCalledWith(11, 7);
  });

  it("denies inactive/archived or role-ineligible membership before project access", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue({ ...member, workspaceArchived: true });
    await expect(authorizeWorkspaceOperation({ userId: 1, workspaceId: 7, projectId: 11, predicate: () => true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(databaseMocks.getProjectForWorkspace).not.toHaveBeenCalled();
  });

  it("returns not-found when a requested project is outside the authorized workspace", async () => {
    databaseMocks.getProjectForWorkspace.mockResolvedValue(undefined);
    await expect(authorizeWorkspaceOperation({ userId: 1, workspaceId: 7, projectId: 99, predicate: () => true })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("denies a disabled capability before any protected upload or workflow side effect", async () => {
    databaseMocks.isWorkspaceCapabilityEnabled.mockReturnValue(false);
    await expect(authorizeWorkspaceOperation({ userId: 1, workspaceId: 7, predicate: () => true, capability: "asset.upload" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
