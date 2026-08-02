"use server";

// Thin Server Actions only — no business logic here, matching app/academics/classrooms/actions.ts.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { updateSchoolBranding } from "@/modules/branding/application/update-school-branding.service";
import { uploadBrandingAsset } from "@/modules/branding/application/upload-branding-asset.service";
import { removeBrandingAsset } from "@/modules/branding/application/remove-branding-asset.service";
import type { BrandingAssetType } from "@/modules/branding/domain/school-branding.entity";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function translateBrandingError(error: unknown): ActionResult<never> {
  if (error instanceof NotFoundError) {
    return { success: false, error: { code: "NOT_FOUND", message: error.message } };
  }
  if (error instanceof BusinessRuleError) {
    return { success: false, error: { code: "BUSINESS_RULE_VIOLATION", message: error.message } };
  }
  if (error instanceof ValidationError) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: error.message } };
  }
  throw error;
}

export async function updateSchoolBrandingAction(input: unknown): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("school.branding.manage");

  try {
    await updateSchoolBranding(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateBrandingError(error);
  }
}

export interface UploadBrandingAssetActionInput {
  assetType: BrandingAssetType;
  file: File;
}

export async function uploadBrandingAssetAction(input: UploadBrandingAssetActionInput): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("school.branding.manage");

  try {
    await uploadBrandingAsset(
      {
        assetType: input.assetType,
        originalFileName: input.file.name,
        mimeType: input.file.type,
        fileSize: input.file.size,
        file: input.file,
      },
      { tenantId: authContext.tenantId, actingUserId: authContext.userId }
    );
    return { success: true, data: null };
  } catch (error) {
    return translateBrandingError(error);
  }
}

export async function removeBrandingAssetAction(assetType: BrandingAssetType): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("school.branding.manage");

  try {
    await removeBrandingAsset(assetType, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateBrandingError(error);
  }
}
