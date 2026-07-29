import "server-only";
import { PrismaSubjectRepository } from "../infrastructure/prisma-subject.repository";
import type { SubjectEntity } from "../domain/subject.entity";

// Read-only, unpaginated — a school's subject list is small, matching listClasses/listSections'
// own "not paginated" reasoning.
export async function listSubjects(context: { tenantId: string }): Promise<SubjectEntity[]> {
  const repository = new PrismaSubjectRepository();
  const result = await repository.findMany(context.tenantId, { page: 1, pageSize: 200 });
  return result.items;
}
