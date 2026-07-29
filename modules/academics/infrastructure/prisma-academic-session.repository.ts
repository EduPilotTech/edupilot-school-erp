import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { AcademicSession as PrismaAcademicSession } from "@/lib/generated/prisma/client";
import type {
  AcademicSessionEntity,
  AcademicSessionStatusValue,
} from "../domain/academic-session.entity";
import type { AcademicSessionRepository } from "../domain/academic-session.repository";

function toEntity(row: PrismaAcademicSession): AcademicSessionEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    sessionName: row.sessionName,
    startDate: row.startDate,
    endDate: row.endDate,
    isCurrent: row.isCurrent,
    status: row.status as AcademicSessionStatusValue,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

// Every tenant-scoped lookup uses the `tenantId_id` compound unique, not a bare `where: { id }`,
// matching the established pattern from PrismaClassRepository/PrismaSectionRepository.
export class PrismaAcademicSessionRepository implements AcademicSessionRepository {
  async findById(tenantId: string, id: string): Promise<AcademicSessionEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.academicSession.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findActive(tenantId: string): Promise<AcademicSessionEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.academicSession.findMany({
        where: { tenantId, deletedAt: null, status: { in: ["UPCOMING", "ACTIVE"] } },
        orderBy: { startDate: "desc" },
      })
    );
    return rows.map(toEntity);
  }
}
