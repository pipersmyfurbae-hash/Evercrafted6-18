import { describe, expect, it } from "vitest";
import {
  assets,
  auditLogs,
  backgroundJobs,
  leads,
  organizations,
  plans,
  projects,
  users,
  workspaces,
  workspaceEntitlements,
  workspaceInvitations,
  workspaceMemberships,
} from "../drizzle/schema";

describe("Ever Engine schema contract", () => {
  it("exports the required multi-tenant and operational tables", () => {
    expect(users).toBeDefined();
    expect(organizations).toBeDefined();
    expect(workspaces).toBeDefined();
    expect(workspaceMemberships).toBeDefined();
    expect(workspaceInvitations).toBeDefined();
    expect(projects).toBeDefined();
    expect(assets).toBeDefined();
    expect(backgroundJobs).toBeDefined();
    expect(plans).toBeDefined();
    expect(workspaceEntitlements).toBeDefined();
    expect(auditLogs).toBeDefined();
    expect(leads).toBeDefined();
  });
});
