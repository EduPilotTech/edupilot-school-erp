import "server-only";
import { PrismaSectionRepository } from "../infrastructure/prisma-section.repository";
import type { SectionEntity } from "../domain/section.entity";

// Read-only — Sprint 4 — Step 4, Step 1: backs the Section dropdown on Student Admission.
// `classId` is optional for the same reason as list-classes.service's `academicSessionId`: the
// current Admission form's three dropdowns are independent, not cascading, so the page fetches
// every section for the tenant. Not paginated — same reasoning as list-classes.service.
export async function listSections(
  context: { tenantId: string },
  classId?: string
): Promise<SectionEntity[]> {
  const repository = new PrismaSectionRepository();
  const result = await repository.findMany(context.tenantId, {
    classId,
    page: 1,
    pageSize: 200,
  });
  return result.items;
}
