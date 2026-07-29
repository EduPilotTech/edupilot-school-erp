import "server-only";
import { PrismaExamTypeRepository } from "../infrastructure/prisma-exam-type.repository";
import type { ExamTypeEntity } from "../domain/exam-type.entity";

// Read-only, unpaginated — a school's exam-type list is small, matching listSubjects' own
// reasoning.
export async function listExamTypes(context: { tenantId: string }): Promise<ExamTypeEntity[]> {
  const repository = new PrismaExamTypeRepository();
  const result = await repository.findMany(context.tenantId, { page: 1, pageSize: 200 });
  return result.items;
}
