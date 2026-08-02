import "server-only";
import { SCHOOL_BRANDING_BUCKET } from "@/lib/storage/buckets";
import { SupabaseStorageService } from "@/lib/storage/supabase-storage.service";
import { PrismaSchoolBrandingRepository } from "../infrastructure/prisma-school-branding.repository";
import type { BrandingAssetType } from "../domain/school-branding.entity";
import type { UpsertSchoolBrandingInput } from "../domain/school-branding.repository";

export interface RemoveBrandingAssetContext {
  tenantId: string;
  actingUserId: string;
}

function clearedAssetField(assetType: BrandingAssetType): Partial<UpsertSchoolBrandingInput> {
  switch (assetType) {
    case "LOGO":
      return { logoKey: null };
    case "SIGNATURE":
      return { signatureKey: null };
    case "SEAL":
      return { sealKey: null };
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

// Clears the DB pointer first, then deletes the Storage object — the reverse order of upload's
// compensation, deliberately: a dangling Storage file with no DB reference is harmless (it's just
// disk usage, cleaned up here best-effort), whereas a DB row pointing at a deleted file would
// break every page rendering it.
export async function removeBrandingAsset(assetType: BrandingAssetType, context: RemoveBrandingAssetContext): Promise<void> {
  const repository = new PrismaSchoolBrandingRepository();
  const existing = await repository.findByTenant(context.tenantId);
  const key = existing ? existingKeyFor(assetType, existing) : null;
  if (!key) return;

  await repository.upsertOne({
    tenantId: context.tenantId,
    updatedBy: context.actingUserId,
    ...clearedAssetField(assetType),
  });

  const storage = new SupabaseStorageService();
  await storage.delete(SCHOOL_BRANDING_BUCKET, key).catch(() => {});
}
