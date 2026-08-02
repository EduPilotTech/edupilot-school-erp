import "server-only";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/document-validation";
import { SCHOOL_BRANDING_BUCKET } from "@/lib/storage/buckets";
import { SupabaseStorageService } from "@/lib/storage/supabase-storage.service";
import { PrismaSchoolBrandingRepository } from "../infrastructure/prisma-school-branding.repository";
import { UnsupportedBrandingAssetTypeError, BrandingAssetTooLargeError } from "../domain/errors";
import type { BrandingAssetType } from "../domain/school-branding.entity";
import type { UpsertSchoolBrandingInput } from "../domain/school-branding.repository";

export interface UploadBrandingAssetInput {
  assetType: BrandingAssetType;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  file: Buffer | Blob | File;
}

export interface UploadBrandingAssetContext {
  tenantId: string;
  actingUserId: string;
}

// `{tenantId}/{assetType}/{uuid}-{sanitizedFileName}` — mirrors modules/students/application/
// document-storage.helpers.ts's buildStorageKey, minus the per-student folder segment (branding
// has no student dimension).
function buildBrandingStorageKey(tenantId: string, assetType: BrandingAssetType, originalFileName: string): string {
  const sanitized = originalFileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `${tenantId}/${assetType.toLowerCase()}/${crypto.randomUUID()}-${sanitized}`;
}

function assetUpdateFor(assetType: BrandingAssetType, storageKey: string): Partial<UpsertSchoolBrandingInput> {
  switch (assetType) {
    case "LOGO":
      return { logoKey: storageKey };
    case "SIGNATURE":
      return { signatureKey: storageKey };
    case "SEAL":
      return { sealKey: storageKey };
  }
}

function existingKeyFor(assetType: BrandingAssetType, keys: { logoKey: string | null; signatureKey: string | null; sealKey: string | null }): string | null {
  switch (assetType) {
    case "LOGO":
      return keys.logoKey;
    case "SIGNATURE":
      return keys.signatureKey;
    case "SEAL":
      return keys.sealKey;
  }
}

// Same sequencing as modules/students/application/upload-student-document.service.ts: upload to
// Storage first, then persist the key — Storage and Postgres share no transaction, so atomicity
// is "upload, then compensate on failure" rather than a database transaction. Unlike that service
// this is an upsert, not an insert, so on success it also deletes the *previous* asset (if any)
// from Storage — a branding logo/signature/seal is replaced, not accumulated.
export async function uploadBrandingAsset(
  input: UploadBrandingAssetInput,
  context: UploadBrandingAssetContext
): Promise<void> {
  const allowedTypes: readonly string[] = ALLOWED_IMAGE_MIME_TYPES;
  if (!allowedTypes.includes(input.mimeType)) {
    throw new UnsupportedBrandingAssetTypeError(`${input.mimeType} is not an accepted image type.`);
  }
  if (input.fileSize > MAX_FILE_SIZE_BYTES) {
    throw new BrandingAssetTooLargeError();
  }

  const repository = new PrismaSchoolBrandingRepository();
  const existing = await repository.findByTenant(context.tenantId);
  const previousKey = existing ? existingKeyFor(input.assetType, existing) : null;

  const storageKey = buildBrandingStorageKey(context.tenantId, input.assetType, input.originalFileName);
  const storage = new SupabaseStorageService();

  await storage.upload({
    bucket: SCHOOL_BRANDING_BUCKET,
    key: storageKey,
    file: input.file,
    contentType: input.mimeType,
  });

  try {
    await repository.upsertOne({
      tenantId: context.tenantId,
      updatedBy: context.actingUserId,
      ...assetUpdateFor(input.assetType, storageKey),
    });
  } catch (error) {
    // Compensate: the file exists in storage but nothing points to it — delete it rather than
    // leave an orphan. Best-effort — a failure here must not mask the original error.
    await storage.delete(SCHOOL_BRANDING_BUCKET, storageKey).catch(() => {});
    throw error;
  }

  if (previousKey && previousKey !== storageKey) {
    await storage.delete(SCHOOL_BRANDING_BUCKET, previousKey).catch(() => {});
  }
}
