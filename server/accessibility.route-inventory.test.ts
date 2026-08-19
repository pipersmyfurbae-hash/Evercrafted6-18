import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const readClientFile = (relativePath: string) => readFileSync(path.resolve(import.meta.dirname, `../client/src/${relativePath}`), "utf8");

describe("complete routed accessibility inventory", () => {
  it("registers all implemented public, Client, workspace, Studio, administration, Personal, invitation, and fallback journeys", () => {
    const app = readClientFile("App.tsx");
    ["/", "/collections", "/journal", "/about", "/contact", "/account", "/privacy", "/terms", "/client", "/client/sign-in", "/app", "/projects", "/search", "/studio", "/notifications", "/settings", "/profile", "/admin", "/invite/:token", "/personal", "/404"].forEach(route => expect(app).toContain(`path="${route}"`));
  });

  it("gives every protected workspace page exactly the shared DashboardLayout main landmark rather than nesting an additional main", () => {
    ["AppHome.tsx", "Projects.tsx", "ProjectDetail.tsx", "Search.tsx", "Studio.tsx", "Notifications.tsx", "Settings.tsx", "Profile.tsx", "Admin.tsx"].forEach(file => {
      const source = readClientFile(`pages/${file}`);
      expect(source).toContain("DashboardLayout");
      expect(source).not.toContain("<DashboardLayout><main");
    });
    expect(readClientFile("pages/Notifications.tsx")).toContain('aria-labelledby="notifications-heading"');
  });

  it("keeps non-workspace routes semantically independent with owner, invitation, and fallback recovery states", () => {
    const personal = readClientFile("pages/Personal.tsx");
    const invite = readClientFile("pages/Invite.tsx");
    const fallback = readClientFile("pages/NotFound.tsx");
    expect(personal).toContain("PersonalLayout");
    expect(personal).toContain("Retry private overview");
    expect(invite).toContain('id="main-content"');
    expect(invite).toContain('role="status"');
    expect(invite).toContain('role="alert"');
    expect(fallback).toContain("SkipLink");
    expect(fallback).toContain("Evercrafted fallback navigation");
  });
});
