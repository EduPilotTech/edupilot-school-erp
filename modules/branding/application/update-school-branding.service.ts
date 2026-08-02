import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaSchoolBrandingRepository } from "../infrastructure/prisma-school-branding.repository";
import { updateSchoolBrandingSchema } from "./dto/school-branding.dto";

export interface UpdateSchoolBrandingContext {
  tenantId: string;
  actingUserId: string;
}

// Text/preference fields only — logo/signature/seal go through upload-branding-asset.service.ts
// instead (a different validation and storage-compensation flow). Both call the same
// repository.upsertOne, which only writes the keys present on its input, so this never touches
// whatever asset keys are already set.
export async function updateSchoolBranding(input: unknown, context: UpdateSchoolBrandingContext): Promise<void> {
  const parsed = updateSchoolBrandingSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid branding data.");
  }

  const repository = new PrismaSchoolBrandingRepository();
  await repository.upsertOne({
    tenantId: context.tenantId,
    updatedBy: context.actingUserId,
    ...parsed.data,
  });
}
