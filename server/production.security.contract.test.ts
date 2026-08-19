import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertNoInventoryCommitment, buildSecureAssetStorageName, normalizeTrustedCheckoutOrigin, validateAssetUpload } from "./productionSafety";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");
const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString("base64");

describe("Checkpoint E security and production readiness", () => {
  it("accepts only canonical, allow-listed upload bytes and issues a non-client-controlled storage name", () => {
    const validated = validateAssetUpload({ name: "wreath.png", mediaType: "image/png", base64: pngHeader });
    expect(validated.mediaType).toBe("image/png");
    expect(validated.checksum).toHaveLength(64);
    expect(buildSecureAssetStorageName({ workspaceId: 7, extension: validated.extension })).toMatch(/^workspaces\/7\/assets\/[0-9a-f-]+\.png$/);
  });

  it("rejects unsafe upload types, malformed base64, filename paths, content-type spoofing, and checksum mismatch", () => {
    expect(() => validateAssetUpload({ name: "x.svg", mediaType: "image/svg+xml", base64: pngHeader })).toThrow("not allowed");
    expect(() => validateAssetUpload({ name: "../wreath.png", mediaType: "image/png", base64: pngHeader })).toThrow("unsafe path");
    expect(() => validateAssetUpload({ name: "wreath.jpg", mediaType: "image/jpeg", base64: pngHeader })).toThrow("do not match");
    expect(() => validateAssetUpload({ name: "wreath.png", mediaType: "image/png", base64: "not-base64!" })).toThrow("canonical base64");
    expect(() => validateAssetUpload({ name: "wreath.png", mediaType: "image/png", base64: pngHeader, checksum: "0".repeat(64) })).toThrow("checksum");
  });

  it("normalizes only exact HTTPS checkout origins and blocks private inventory fields", () => {
    expect(normalizeTrustedCheckoutOrigin("https://Checkout.Evercrafted.test")).toBe("https://checkout.evercrafted.test");
    expect(() => normalizeTrustedCheckoutOrigin("http://checkout.evercrafted.test")).toThrow("HTTPS");
    expect(() => normalizeTrustedCheckoutOrigin("https://checkout.evercrafted.test/path")).toThrow("exact HTTPS origin");
    expect(() => assertNoInventoryCommitment({ composition: { supplier_cost: 12 } })).toThrow("Private inventory");
    expect(() => assertNoInventoryCommitment({ provenance: { familyKey: "BF-PEONY" } })).not.toThrow();
  });

  it("uses a central workspace guard, atomic asset records, owner-only checkout-origin configuration, and database-backed webhook idempotency", () => {
    const router = read("server/routers.ts");
    const db = read("server/db.ts");
    const schema = read("drizzle/schema.ts");
    expect(router).toContain("authorizeWorkspaceOperation");
    expect(router).toContain("ownerProcedure");
    expect(router).toContain("setTrustedCheckoutOrigin");
    expect(db).toContain("return db.transaction(async tx => {");
    expect(db).toContain("claimWebhookReceipt");
    expect(db).toContain("isDuplicateKeyError");
    expect(schema).toContain("trustedCheckoutOrigins");
    expect(schema).toContain("webhookReceipts");
    expect(schema).toContain("webhook_receipts_provider_event_unique");
  });

  it("does not activate a checkout provider or expose a webhook endpoint", () => {
    const router = read("server/routers.ts");
    const contract = read("docs/architecture/SECURITY_PRODUCTION_READINESS_CONTRACT.md");
    expect(router).not.toContain("stripe");
    expect(router).not.toContain("/api/webhooks");
    expect(contract).toContain("without enabling a payment processor");
    expect(contract).toContain("no origin is trusted by default");
  });
});
