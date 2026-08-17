import { describe, expect, it } from "vitest";
import { canAdministerWorkspace, canManageWorkspace } from "./db";
import { isPlatformOwner } from "./_core/trpc";

describe("workspace role policies", () => {
  it("allows owners, administrators, and members to create or modify workspace work", () => {
    expect(canManageWorkspace("owner")).toBe(true);
    expect(canManageWorkspace("admin")).toBe(true);
    expect(canManageWorkspace("member")).toBe(true);
  });

  it("prevents viewers and clients from workspace management actions", () => {
    expect(canManageWorkspace("viewer")).toBe(false);
    expect(canManageWorkspace("client")).toBe(false);
  });

  it("reserves workspace administration for owners and administrators", () => {
    expect(canAdministerWorkspace("owner")).toBe(true);
    expect(canAdministerWorkspace("admin")).toBe(true);
    expect(canAdministerWorkspace("member")).toBe(false);
    expect(canAdministerWorkspace("client")).toBe(false);
    expect(canAdministerWorkspace("viewer")).toBe(false);
  });
});

describe("platform owner policy", () => {
  it("requires an exact configured owner identity match", () => {
    expect(isPlatformOwner("platform-owner", "platform-owner")).toBe(true);
    expect(isPlatformOwner("administrator", "platform-owner")).toBe(false);
    expect(isPlatformOwner(undefined, "platform-owner")).toBe(false);
    expect(isPlatformOwner("platform-owner", undefined)).toBe(false);
  });
});
