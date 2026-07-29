import "server-only";
import { listStudentsFilterSchema } from "./dto/list-students.dto";
import { PrismaStudentRepository } from "../infrastructure/prisma-student.repository";
import type { StudentListResult } from "../domain/student.repository";

// Read-only — Sprint 4 — Step 5. Same shape as modules/users/application/list-users.service.ts:
// safeParse + a hard fallback rather than throwing, since this is fed from URL searchParams a
// user can freely edit; a malformed query string should fall back to page 1, not surface an
// error page for what's ultimately a navigation concern.
export async function listStudents(
  filter: unknown,
  context: { tenantId: string }
): Promise<StudentListResult> {
  const parsed = listStudentsFilterSchema.safeParse(filter);
  const effectiveFilter = parsed.success ? parsed.data : { page: 1, pageSize: 20 };

  const repository = new PrismaStudentRepository();
  return repository.findMany(context.tenantId, effectiveFilter);
}
