import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const drizzleRoot = path.join(projectRoot, "drizzle");
const migrationNames = readdirSync(drizzleRoot).filter(file => /^\d{4}_.+\.sql$/.test(file)).map(file => file.replace(/\.sql$/, "")).sort();
const journal = JSON.parse(readFileSync(path.join(drizzleRoot, "meta", "_journal.json"), "utf8")) as { entries: { idx: number; tag: string }[] };
const ledger = readFileSync(path.join(projectRoot, "docs", "roadmap", "MIGRATION_LEDGER.md"), "utf8");

describe("Drizzle migration artifact governance", () => {
  it("keeps every root migration journaled, snapshotted, and recorded in the migration ledger", () => {
    expect(migrationNames).toEqual(journal.entries.map(entry => entry.tag));
    journal.entries.forEach(entry => {
      expect(existsSync(path.join(drizzleRoot, "meta", `${String(entry.idx).padStart(4, "0")}_snapshot.json`))).toBe(true);
      expect(ledger).toContain(`\`${entry.tag}\``);
    });
  });

  it("keeps the committed migration artifacts additive and reviewable", () => {
    migrationNames.forEach(name => {
      const sql = readFileSync(path.join(drizzleRoot, `${name}.sql`), "utf8").toUpperCase();
      expect(sql, name).toMatch(/CREATE TABLE|ALTER TABLE/);
      expect(sql, name).not.toContain("DROP TABLE");
      expect(sql, name).not.toContain("TRUNCATE TABLE");
    });
  });
});
