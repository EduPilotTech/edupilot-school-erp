import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type {
  Prisma,
  StudentTransportAssignment as PrismaStudentTransportAssignment,
} from "@/lib/generated/prisma/client";
import type {
  StudentTransportAssignmentRepository,
  UpdateStudentTransportAssignmentStatusInput,
  UpsertStudentTransportAssignmentInput,
} from "../domain/student-transport-assignment.repository";
import type {
  StudentTransportAssignmentEntity,
  StudentTransportAssignmentStatusValue,
} from "../domain/student-transport-assignment.entity";

function toEntity(row: PrismaStudentTransportAssignment): StudentTransportAssignmentEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    academicSessionId: row.academicSessionId,
    routeId: row.routeId,
    stopId: row.stopId,
    tripType: row.tripType,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaStudentTransportAssignmentRepository implements StudentTransportAssignmentRepository {
  async findByStudent(
    tenantId: string,
    studentId: string,
    academicSessionId: string
  ): Promise<StudentTransportAssignmentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.studentTransportAssignment.findUnique({
        where: { tenantId_studentId_academicSessionId: { tenantId, studentId, academicSessionId } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByRoute(
    tenantId: string,
    routeId: string,
    academicSessionId: string,
    filter?: { status?: StudentTransportAssignmentStatusValue }
  ): Promise<StudentTransportAssignmentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.studentTransportAssignment.findMany({
        where: { tenantId, routeId, academicSessionId, status: filter?.status },
      })
    );
    return rows.map(toEntity);
  }

  async upsertForStudent(
    input: UpsertStudentTransportAssignmentInput,
    tx?: Prisma.TransactionClient
  ): Promise<StudentTransportAssignmentEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.studentTransportAssignment.upsert({
          where: {
            tenantId_studentId_academicSessionId: {
              tenantId: input.tenantId,
              studentId: input.studentId,
              academicSessionId: input.academicSessionId,
            },
          },
          create: {
            tenantId: input.tenantId,
            studentId: input.studentId,
            academicSessionId: input.academicSessionId,
            routeId: input.routeId,
            stopId: input.stopId,
            tripType: input.tripType ?? "PICKUP_AND_DROP",
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
          update: {
            routeId: input.routeId,
            stopId: input.stopId,
            tripType: input.tripType ?? "PICKUP_AND_DROP",
            status: "ACTIVE",
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    input: UpdateStudentTransportAssignmentStatusInput
  ): Promise<StudentTransportAssignmentEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.studentTransportAssignment.update({
        where: { tenantId_id: { tenantId, id } },
        data: { status: input.status, updatedBy: input.updatedBy ?? null },
      })
    );
    return toEntity(row);
  }
}
