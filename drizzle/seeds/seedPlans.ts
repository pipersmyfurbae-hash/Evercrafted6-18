/**
 * Controlled non-production reference-data seed.
 * Run only in a designated development or staging environment after the
 * foundation migration is applied; it intentionally does not create users,
 * customer workspaces, or production-like customer content.
 */
import { eq } from "drizzle-orm";
import { getDb } from "../../server/db";
import { plans } from "../schema";

const referencePlans = [
  { slug: "foundation", name: "Foundation", description: "Personal and small-team workspace access." },
  { slug: "studio", name: "Studio", description: "Creative workflow and governed asset operations." },
  { slug: "scale", name: "Scale", description: "Expanded team, governance, and operational capabilities." },
] as const;

export async function seedReferencePlans() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  for (const plan of referencePlans) {
    const existing = await db.select({ id: plans.id }).from(plans).where(eq(plans.slug, plan.slug)).limit(1);
    if (existing[0]) continue;
    await db.insert(plans).values(plan);
  }
  return referencePlans.length;
}
