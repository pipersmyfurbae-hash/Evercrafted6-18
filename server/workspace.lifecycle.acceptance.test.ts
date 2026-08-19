import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { isWorkspaceInvitationAcceptable } from "./db";

const databaseMocks = vi.hoisted(() => ({
  acceptWorkspaceInvitation: vi.fn(),
  createOrganizationWorkspace: vi.fn(),
  createWorkspaceInvitation: vi.fn(),
  getWorkspaceMembership: vi.fn(),
  listWorkspaceInvitations: vi.fn(),
  listWorkspaceMembers: vi.fn(),
  updateWorkspaceMemberRole: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), ...databaseMocks }));
vi.mock("./_core/env", async importOriginal => ({ ...(await importOriginal<typeof import("./_core/env")>()), ENV: { ownerOpenId: "platform-owner" } }));
import { appRouter } from "./routers";

const context = (userId = 42, openId = "member-42"): TrpcContext => ({
  user: { id: userId, openId, name: "Lifecycle member", email: "member@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {} as TrpcContext["req"], res: {} as TrpcContext["res"],
});

const membership = (role: "owner" | "admin" | "member" | "viewer" | "client", status: "active" | "invited" = "active") => ({ workspaceId: 8, workspaceSlug: "lifecycle", workspaceName: "Lifecycle", workspaceKind: "organization" as const, workspaceArchived: false, membershipId: 4, role, status });

describe("workspace identity lifecycle acceptance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an organization workspace with the authenticated caller as its initial owner", async () => {
    databaseMocks.createOrganizationWorkspace.mockResolvedValue({ id: 8, name: "Design collective", kind: "organization" });
    await expect(appRouter.createCaller(context(42)).workspace.createOrganization({ organizationName: "Design collective", workspaceName: "Studio collective" })).resolves.toMatchObject({ id: 8 });
    expect(databaseMocks.createOrganizationWorkspace).toHaveBeenCalledWith({ ownerUserId: 42, organizationName: "Design collective", workspaceName: "Studio collective" });
  });

  it("allows an administrator to create and list invitations but rejects a member before either repository action", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(membership("admin"));
    databaseMocks.createWorkspaceInvitation.mockResolvedValue({ id: 11, token: "x".repeat(32), role: "client" });
    databaseMocks.listWorkspaceInvitations.mockResolvedValue([{ id: 11, email: "invitee@example.com" }]);
    await expect(appRouter.createCaller(context()).workspace.invite({ workspaceId: 8, email: "invitee@example.com", role: "client" })).resolves.toMatchObject({ id: 11 });
    await expect(appRouter.createCaller(context()).workspace.listInvitations({ workspaceId: 8 })).resolves.toHaveLength(1);
    expect(databaseMocks.createWorkspaceInvitation).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 8, invitedByUserId: 42, role: "client" }));

    databaseMocks.getWorkspaceMembership.mockResolvedValue(membership("member"));
    await expect(appRouter.createCaller(context()).workspace.invite({ workspaceId: 8, email: "another@example.com", role: "viewer" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(databaseMocks.createWorkspaceInvitation).toHaveBeenCalledTimes(1);
  });

  it("accepts a bounded invitation token for the authenticated user and allows active members to list workspace members", async () => {
    databaseMocks.acceptWorkspaceInvitation.mockResolvedValue({ workspaceId: 8, userId: 42, status: "active" });
    databaseMocks.getWorkspaceMembership.mockResolvedValue(membership("client"));
    databaseMocks.listWorkspaceMembers.mockResolvedValue([{ userId: 42, role: "client", status: "active" }]);
    await expect(appRouter.createCaller(context()).workspace.acceptInvitation({ token: "x".repeat(32) })).resolves.toMatchObject({ workspaceId: 8, userId: 42 });
    await expect(appRouter.createCaller(context()).workspace.listMembers({ workspaceId: 8 })).resolves.toHaveLength(1);
    expect(databaseMocks.acceptWorkspaceInvitation).toHaveBeenCalledWith({ token: "x".repeat(32), user: expect.objectContaining({ id: 42 }) });
  });

  it("rejects revoked, accepted, and expired invitations through the shared validity predicate", () => {
    const now = new Date("2026-08-19T00:00:00.000Z");
    expect(isWorkspaceInvitationAcceptable({ revokedAt: null, acceptedAt: null, expiresAt: new Date("2026-08-20T00:00:00.000Z") }, now)).toBe(true);
    expect(isWorkspaceInvitationAcceptable({ revokedAt: new Date("2026-08-18T00:00:00.000Z"), acceptedAt: null, expiresAt: new Date("2026-08-20T00:00:00.000Z") }, now)).toBe(false);
    expect(isWorkspaceInvitationAcceptable({ revokedAt: null, acceptedAt: new Date("2026-08-18T00:00:00.000Z"), expiresAt: new Date("2026-08-20T00:00:00.000Z") }, now)).toBe(false);
    expect(isWorkspaceInvitationAcceptable({ revokedAt: null, acceptedAt: null, expiresAt: new Date("2026-08-18T00:00:00.000Z") }, now)).toBe(false);
  });

  it("rejects an inactive membership before workspace-member data is queried", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(membership("viewer", "invited"));
    await expect(appRouter.createCaller(context()).workspace.listMembers({ workspaceId: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(databaseMocks.listWorkspaceMembers).not.toHaveBeenCalled();
  });

  it("allows an owner or administrator to update a member role and rejects a non-administrator before the write", async () => {
    databaseMocks.getWorkspaceMembership.mockResolvedValue(membership("owner"));
    databaseMocks.updateWorkspaceMemberRole.mockResolvedValue({ workspaceId: 8, userId: 77, role: "viewer" });
    await expect(appRouter.createCaller(context()).workspace.updateMemberRole({ workspaceId: 8, userId: 77, role: "viewer" })).resolves.toMatchObject({ role: "viewer" });
    expect(databaseMocks.updateWorkspaceMemberRole).toHaveBeenCalledWith({ workspaceId: 8, userId: 77, role: "viewer", actorUserId: 42 });

    databaseMocks.getWorkspaceMembership.mockResolvedValue(membership("client"));
    await expect(appRouter.createCaller(context()).workspace.updateMemberRole({ workspaceId: 8, userId: 77, role: "member" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(databaseMocks.updateWorkspaceMemberRole).toHaveBeenCalledTimes(1);
  });

  it("rejects a workspace owner who is not the exact platform owner from the Personal command", async () => {
    await expect(appRouter.createCaller(context(42, "workspace-owner-only")).personal.commandCenterAccess()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
