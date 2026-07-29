import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type {
  Prisma,
  StudentGuardian as PrismaStudentGuardian,
} from "@/lib/generated/prisma/client";
import type {
  GuardianRelationshipValue,
  LinkStudentGuardianInput,
  StudentGuardianLink,
  StudentGuardianRepository,
  StudentGuardianWithGuardianName,
} from "../domain/student-guardian.repository";

function toLink(row: PrismaStudentGuardian): StudentGuardianLink {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    guardianId: row.guardianId,
    relationship: row.relationship as GuardianRelationshipValue,
    isPrimary: row.isPrimary,
    createdAt: row.createdAt,
  };
}

// StudentGuardian has no (tenantId, id) compound unique (nothing references it via composite
// FK, unlike Class/Student/Guardian) — lookups/writes below use `findFirst`/`deleteMany` with
// `tenantId` as an explicit filter, the same approach modules/users' UserRoleRepository takes
// for the same reason.
export class PrismaStudentGuardianRepository implements StudentGuardianRepository {
  async findByStudentAndGuardian(
    tenantId: string,
    studentId: string,
    guardianId: string
  ): Promise<StudentGuardianLink | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.studentGuardian.findFirst({ where: { tenantId, studentId, guardianId } })
    );
    return row ? toLink(row) : null;
  }

  async listForStudent(
    tenantId: string,
    studentId: string
  ): Promise<StudentGuardianWithGuardianName[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.studentGuardian.findMany({
        where: { tenantId, studentId },
        include: { guardian: true },
        orderBy: { createdAt: "asc" },
      })
    );

    return rows.map((row) => ({
      ...toLink(row),
      guardianFullName: row.guardian.fullName,
      guardianPhone: row.guardian.phone,
      guardianEmail: row.guardian.email,
    }));
  }

  async listForGuardian(tenantId: string, guardianId: string): Promise<StudentGuardianLink[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.studentGuardian.findMany({ where: { tenantId, guardianId }, orderBy: { createdAt: "asc" } })
    );
    return rows.map(toLink);
  }

  async countForStudent(tenantId: string, studentId: string, excludingId?: string): Promise<number> {
    return withTenantContext(tenantId, (tx) =>
      tx.studentGuardian.count({
        where: {
          tenantId,
          studentId,
          id: excludingId ? { not: excludingId } : undefined,
        },
      })
    );
  }

  async link(
    input: LinkStudentGuardianInput,
    tx?: Prisma.TransactionClient
  ): Promise<StudentGuardianLink> {
    const row = await withTenantContext(
      input.tenantId,
      (t) =>
        t.studentGuardian.create({
          data: {
            tenantId: input.tenantId,
            studentId: input.studentId,
            guardianId: input.guardianId,
            relationship: input.relationship,
            isPrimary: input.isPrimary ?? false,
            createdBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toLink(row);
  }

  async unlink(tenantId: string, id: string): Promise<void> {
    await withTenantContext(tenantId, (tx) =>
      tx.studentGuardian.deleteMany({ where: { id, tenantId } })
    );
  }
}
