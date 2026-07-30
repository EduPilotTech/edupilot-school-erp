import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type {
  Prisma,
  StudentHostelAssignment as PrismaStudentHostelAssignment,
} from "@/lib/generated/prisma/client";
import type {
  CreateStudentHostelAssignmentInput,
  StudentHostelAssignmentRepository,
} from "../domain/student-hostel-assignment.repository";
import type {
  HostelAssignmentStatusValue,
  StudentHostelAssignmentEntity,
} from "../domain/student-hostel-assignment.entity";

function toEntity(row: PrismaStudentHostelAssignment): StudentHostelAssignmentEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    academicSessionId: row.academicSessionId,
    roomId: row.roomId,
    bedId: row.bedId,
    dietPreference: row.dietPreference,
    checkInDate: row.checkInDate,
    checkOutDate: row.checkOutDate,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

// Notice there is no `update` method here at all — only `create` and `close`, matching the
// domain interface exactly (mirrors PrismaEnrollmentRepository's own precedent). "Never
// overwrite historical hostel assignment" is enforced by the type system, not just a comment.
export class PrismaStudentHostelAssignmentRepository implements StudentHostelAssignmentRepository {
  async findCurrentForStudent(
    tenantId: string,
    studentId: string,
    academicSessionId: string
  ): Promise<StudentHostelAssignmentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.studentHostelAssignment.findFirst({
        where: { tenantId, studentId, academicSessionId, checkOutDate: null },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findHistoryForStudent(tenantId: string, studentId: string): Promise<StudentHostelAssignmentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.studentHostelAssignment.findMany({
        where: { tenantId, studentId },
        orderBy: { checkInDate: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async findCurrentForRoom(tenantId: string, roomId: string): Promise<StudentHostelAssignmentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.studentHostelAssignment.findMany({
        where: { tenantId, roomId, checkOutDate: null },
      })
    );
    return rows.map(toEntity);
  }

  async findCurrentForAcademicSession(
    tenantId: string,
    academicSessionId: string
  ): Promise<StudentHostelAssignmentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.studentHostelAssignment.findMany({
        where: { tenantId, academicSessionId, checkOutDate: null },
      })
    );
    return rows.map(toEntity);
  }

  async create(
    input: CreateStudentHostelAssignmentInput,
    tx?: Prisma.TransactionClient
  ): Promise<StudentHostelAssignmentEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.studentHostelAssignment.create({
          data: {
            tenantId: input.tenantId,
            studentId: input.studentId,
            academicSessionId: input.academicSessionId,
            roomId: input.roomId,
            bedId: input.bedId,
            dietPreference: input.dietPreference ?? null,
            checkInDate: input.checkInDate,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async close(
    tenantId: string,
    id: string,
    checkOutDate: Date,
    status: HostelAssignmentStatusValue,
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<StudentHostelAssignmentEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.studentHostelAssignment.update({
          where: { tenantId_id: { tenantId, id } },
          data: { checkOutDate, status, updatedBy },
        }),
      tx
    );
    return toEntity(row);
  }
}
