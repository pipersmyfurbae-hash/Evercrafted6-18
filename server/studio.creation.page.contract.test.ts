import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const creationSource = readFileSync(path.resolve(import.meta.dirname, "../client/src/components/StudioProjectCreation.tsx"), "utf8");
const studioSource = readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Studio.tsx"), "utf8");

describe("Studio project-creation contract", () => {
  it("uses the tenant-scoped typed project-create mutation with pending and error states", () => {
    ["trpc.project.create.useMutation", "workspaceId", "createProject.isPending", "createProject.error", "onCreated(project.id)"].forEach(token => expect(creationSource).toContain(token));
  });

  it("makes project creation available from the Studio route", () => {
    expect(studioSource).toContain("StudioProjectCreation");
    expect(studioSource).toContain("onCreated={setProjectId}");
  });
});
