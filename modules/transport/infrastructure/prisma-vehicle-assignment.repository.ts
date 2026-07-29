import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, VehicleAssignment as PrismaVehicleAssignment } from "@/lib/generated/prisma/client";
import type {
  UpsertVehicleAssignmentInput,
  VehicleAssignmentRepository,
} from "../domain/vehicle-assignment.repository";
import type { VehicleAssignmentEntity } from "../domain/vehicle-assignment.entity";

function toEntity(row: PrismaVehicleAssignment): VehicleAssignmentEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    routeId: row.routeId,
    academicSessionId: row.academicSessionId,
    vehicleId: row.vehicleId,
    driverId: row.driverId,
    helperId: row.helperId,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaVehicleAssignmentRepository implements VehicleAssignmentRepository {
  async findByRoute(
    tenantId: string,
    routeId: string,
    academicSessionId: string
  ): Promise<VehicleAssignmentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.vehicleAssignment.findUnique({
        where: { tenantId_routeId_academicSessionId: { tenantId, routeId, academicSessionId } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByVehicle(
    tenantId: string,
    vehicleId: string,
    academicSessionId: string
  ): Promise<VehicleAssignmentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.vehicleAssignment.findUnique({
        where: { tenantId_vehicleId_academicSessionId: { tenantId, vehicleId, academicSessionId } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByAcademicSession(tenantId: string, academicSessionId: string): Promise<VehicleAssignmentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.vehicleAssignment.findMany({ where: { tenantId, academicSessionId, isActive: true } })
    );
    return rows.map(toEntity);
  }

  async upsertForRoute(
    input: UpsertVehicleAssignmentInput,
    tx?: Prisma.TransactionClient
  ): Promise<VehicleAssignmentEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.vehicleAssignment.upsert({
          where: {
            tenantId_routeId_academicSessionId: {
              tenantId: input.tenantId,
              routeId: input.routeId,
              academicSessionId: input.academicSessionId,
            },
          },
          create: {
            tenantId: input.tenantId,
            routeId: input.routeId,
            academicSessionId: input.academicSessionId,
            vehicleId: input.vehicleId,
            driverId: input.driverId,
            helperId: input.helperId ?? null,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
          update: {
            vehicleId: input.vehicleId,
            driverId: input.driverId,
            helperId: input.helperId ?? null,
            isActive: true,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async deactivate(tenantId: string, id: string, updatedBy: string | null): Promise<VehicleAssignmentEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.vehicleAssignment.update({
        where: { tenantId_id: { tenantId, id } },
        data: { isActive: false, updatedBy },
      })
    );
    return toEntity(row);
  }
}
