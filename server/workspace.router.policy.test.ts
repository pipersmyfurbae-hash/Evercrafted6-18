import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const databaseMocks = vi.hoisted(() => ({
  ensurePersonalWorkspace: vi.fn(),
  getWorkspaceMembership: vi.fn(),
  listProjectsForWorkspace: vi.fn(),
  listWorkspacesForUser: vi.fn(),
  updateUserProfile: vi.fn(),
  writeAuditLog: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, ...databaseMocks };
});

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 42,
    openId: "workspace-test-user",
    name: "Workspace Test User",
    email: "workspace@example.com",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return { user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const activeMembership = (role: "owner" | "admin" | "member" | "viewer" | "client") => ({
  workspaceId: 9,
  workspaceSlug: "test-space",
  workspaceName: "Test space",
  workspaceKind: "organization" as const,
  workspaceArchived: false,
  membershipId: 7,
  role,
  status: "active" as const,
});

describe("protected workspace router policies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provisions a personal workspace before returning the member workspace list", async () => {
    const personalWorkspace = { id: 3, slug: "me-42", name: "Workspace Test User's space", kind: "personal" };
    const availableWorkspaces = [{ id: 3, slug: "me-42", name: "Workspace Test User's space", kind: "personal", role: "owner" }];
    databaseMocks.ensurePersonalWorkspace.mockResolvedValue(personalWorkspace);
    databaseMocks.listWorkspacesForUser.mockResolvedValue(availableWorkspaces);

    const result = await appRouter.createCaller(createContext()).workspace.bootstrap();

    expect(databaseMocks.ensurePersonalWorkspace).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }));
    expect(databaseMocks.listWorkspacesForUser).toHaveBeenCalledWith(42);
    expect(result).toEqual({ personalWorkspace, availableWorkspaces });
  });

  it("allows a member to manage a workspace and rejects a viewer", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValueOnce(activeMembership("member"));
    await expect(appRouter.createCaller(createContext()).workspace.canManage({ workspaceId: 9 })).resolves.toEqual({ allowed: true, role: "member" });

    databaseMocks.getWorkspaceMembership.mockResolvedValueOnce(activeMembership("viewer"));
    await expect(appRouter.createCaller(createContext()).workspace.canManage({ workspaceId: 9 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("stops a user with no membership before a cross-tenant project list is queried", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(undefined);

    await expect(appRouter.createCaller(createContext()).project.list({ workspaceId: 999 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(databaseMocks.listProjectsForWorkspace).not.toHaveBeenCalled();
  });

  it("updates the caller profile and records the associated audit event", async () => {
    const updatedUser = { ...createContext().user!, name: "Updated User", email: "updated@example.com" };
    databaseMocks.updateUserProfile.mockResolvedValue(updatedUser);
    databaseMocks.writeAuditLog.mockResolvedValue(undefined);

    await expect(appRouter.createCaller(createContext()).profile.update({ name: "Updated User", email: "updated@example.com" })).resolves.toEqual(updatedUser);
    expect(databaseMocks.updateUserProfile).toHaveBeenCalledWith({ userId: 42, name: "Updated User", email: "updated@example.com" });
    expect(databaseMocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: 42, action: "profile.updated", targetType: "user", targetId: "42" }));
  });
});
