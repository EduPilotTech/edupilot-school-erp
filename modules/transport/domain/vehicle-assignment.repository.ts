import type { Prisma } from "@/lib/generated/prisma/client";
import type { VehicleAssignmentEntity } from "./vehicle-assignment.entity";

export interface UpsertVehicleAssignmentInput {
  tenantId: string;
  routeId: string;
  academicSessionId: string;
  vehicleId: string;
  driverId: string;
  helperId?: string | null;
  createdBy?: string | null;
}

// One row per (route, academicSession) — `upsertForRoute` is the primary write path (Decision
// 2: reassignment updates the same row, mirroring StudentFeeAssignment's own upsert shape).
export interface VehicleAssignmentRepository {
  findByRoute(tenantId: string, routeId: string, academicSessionId: string): Promise<VehicleAssignmentEntity | null>;
  findByVehicle(
    tenantId: string,
    vehicleId: string,
    academicSessionId: string
  ): Promise<VehicleAssignmentEntity | null>;
  findByAcademicSession(tenantId: string, academicSessionId: string): Promise<VehicleAssignmentEntity[]>;
  upsertForRoute(
    input: UpsertVehicleAssignmentInput,
    tx?: Prisma.TransactionClient
  ): Promise<VehicleAssignmentEntity>;
  deactivate(tenantId: string, id: string, updatedBy: string | null): Promise<VehicleAssignmentEntity>;
}
