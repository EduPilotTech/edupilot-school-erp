import "server-only";
import { PrismaClassRepository } from "../infrastructure/prisma-class.repository";
import type { ClassEntity } from "../domain/class.entity";

// Read-only — Sprint 4 — Step 4, Step 1: backs the Class dropdown on Student Admission.
// `academicSessionId` is optional: the current Admission form (Sprint 4 — Step 3) renders three
// independent, non-cascading dropdowns — not filtered live by the user's session selection — so
// the page fetches every class for the tenant. The filter still exists (matching
// ClassRepository.findMany's own optional filter) so a future cascading-select redesign can pass
// it without a repository/service change. Not paginated — a school's class list is small.
export async function listClasses(
  context: { tenantId: string },
  academicSessionId?: string
): Promise<ClassEntity[]> {
  const repository = new PrismaClassRepository();
  const result = await repository.findMany(context.tenantId, {
    academicSessionId,
    page: 1,
    pageSize: 200,
  });
  return result.items;
}
