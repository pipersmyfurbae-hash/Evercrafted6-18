import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const studioSource = readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Studio.tsx"), "utf8");
const assignmentSource = readFileSync(path.resolve(import.meta.dirname, "../client/src/components/StudioReviewerAssignments.tsx"), "utf8");

describe("Studio reviewer-assignment UI contract", () => {
  it("exposes the assignment summary from the existing reviewer selection and persisted review records", () => {
    expect(studioSource).toContain("reviewerUserId");
    expect(studioSource).toContain("StudioReviewerAssignments");
    expect(assignmentSource).toContain("Assigned to:");
    expect(assignmentSource).toContain("Open to eligible workspace members");
  });
});
