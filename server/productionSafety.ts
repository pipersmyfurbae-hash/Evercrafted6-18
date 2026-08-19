import { TRPCError } from "@trpc/server";
import { createHash, randomUUID } from "node:crypto";

const allowedUploadTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "audio/wav": "wav",
  "audio/mpeg": "mp3",
  "video/mp4": "mp4",
} as const;

const inventoryOrCommercialKeys = new Set([
  "availability", "bom", "cost", "currency", "inventory", "price", "quantity", "reservation", "sku", "stock", "supplier", "suppliercost", "vendor",
]);

export type AllowedUploadType = keyof typeof allowedUploadTypes;

function assertCanonicalBase64(value: string) {
  const normalized = value.replace(/\s/g, "");
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(normalized)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Upload data must be canonical base64" });
  }
  const bytes = Buffer.from(normalized, "base64");
  if (!bytes.byteLength || bytes.byteLength > 5 * 1024 * 1024) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Uploads must be between 1 byte and 5 MiB" });
  }
  return bytes;
}

function matchesFileSignature(bytes: Buffer, mediaType: AllowedUploadType) {
  if (mediaType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mediaType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mediaType === "image/webp") return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (mediaType === "application/pdf") return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mediaType === "audio/wav") return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WAVE";
  if (mediaType === "audio/mpeg") return bytes.subarray(0, 3).toString("ascii") === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  return bytes.subarray(4, 8).toString("ascii") === "ftyp";
}

export function validateAssetUpload(input: { name: string; mediaType: string; base64: string; checksum?: string }) {
  const mediaType = input.mediaType.toLowerCase() as AllowedUploadType;
  if (!(mediaType in allowedUploadTypes)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This upload media type is not allowed" });
  }
  if (/[\\/\0]/.test(input.name) || input.name.trim().length > 255) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Upload name contains an unsafe path or invalid length" });
  }
  if (input.checksum && !/^[a-fA-F0-9]{64}$/.test(input.checksum)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Checksum must be a SHA-256 hex digest" });
  }
  const bytes = assertCanonicalBase64(input.base64);
  if (!matchesFileSignature(bytes, mediaType)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Upload bytes do not match the declared media type" });
  }
  const calculatedChecksum = createHash("sha256").update(bytes).digest("hex");
  if (input.checksum && input.checksum.toLowerCase() !== calculatedChecksum) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Upload checksum does not match the decoded bytes" });
  }
  return { bytes, mediaType, checksum: calculatedChecksum, extension: allowedUploadTypes[mediaType] };
}

export function buildSecureAssetStorageName(input: { workspaceId: number; assetId?: number; extension: string }) {
  const scope = input.assetId ? `assets/${input.assetId}/revisions` : "assets";
  return `workspaces/${input.workspaceId}/${scope}/${randomUUID()}.${input.extension}`;
}

export function normalizeTrustedCheckoutOrigin(value: string) {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new TRPCError({ code: "BAD_REQUEST", message: "Checkout origin must be a valid absolute HTTPS origin" }); }
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Checkout origin must be an exact HTTPS origin without a path, credentials, query, or fragment" });
  }
  return url.origin.toLowerCase();
}

export function assertNoInventoryCommitment(value: unknown) {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (inventoryOrCommercialKeys.has(key.replace(/[_-]/g, "").toLowerCase())) {
      throw new Error("Private inventory or commercial fields are not permitted in this governed record");
    }
    assertNoInventoryCommitment(nested);
  }
}
