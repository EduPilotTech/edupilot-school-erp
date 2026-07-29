import "server-only";
import { PrismaClassroomRepository } from "../infrastructure/prisma-classroom.repository";
import type { ClassroomEntity } from "../domain/classroom.entity";

// Read-only, unpaginated — same reasoning as listSubjects.
export async function listClassrooms(context: { tenantId: string }): Promise<ClassroomEntity[]> {
  const repository = new PrismaClassroomRepository();
  const result = await repository.findMany(context.tenantId, { page: 1, pageSize: 200 });
  return result.items;
}
