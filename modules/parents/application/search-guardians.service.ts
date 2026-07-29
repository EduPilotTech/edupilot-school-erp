import "server-only";
import { PrismaGuardianRepository } from "@/modules/students/infrastructure/prisma-guardian.repository";
import type { GuardianEntity } from "@/modules/students/domain/guardian.entity";

// Backs the staff-facing "link a guardian to a parent portal account" search — reuses
// GuardianRepository.findMany's existing search filter, no new repository method needed.
export async function searchGuardians(tenantId: string, search: string): Promise<GuardianEntity[]> {
  const repository = new PrismaGuardianRepository();
  const result = await repository.findMany(tenantId, { search, page: 1, pageSize: 20 });
  return result.items;
}
