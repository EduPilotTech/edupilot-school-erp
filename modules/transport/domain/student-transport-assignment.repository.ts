import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  StudentTransportAssignmentEntity,
  StudentTransportAssignmentStatusValue,
  StudentTransportTripTypeValue,
} from "./student-transport-assignment.entity";

export interface UpsertStudentTransportAssignmentInput {
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  routeId: string;
  stopId: string;
  tripType?: StudentTransportTripTypeValue;
  createdBy?: string | null;
}

export interface UpdateStudentTransportAssignmentStatusInput {
  status: StudentTransportAssignmentStatusValue;
  updatedBy?: string | null;
}

export interface StudentTransportAssignmentRepository {
  findByStudent(
    tenantId: string,
    studentId: string,
    academicSessionId: string
  ): Promise<StudentTransportAssignmentEntity | null>;
  findByRoute(
    tenantId: string,
    routeId: string,
    academicSessionId: string,
    filter?: { status?: StudentTransportAssignmentStatusValue }
  ): Promise<StudentTransportAssignmentEntity[]>;
  upsertForStudent(
    input: UpsertStudentTransportAssignmentInput,
    tx?: Prisma.TransactionClient
  ): Promise<StudentTransportAssignmentEntity>;
  updateStatus(
    tenantId: string,
    id: string,
    input: UpdateStudentTransportAssignmentStatusInput
  ): Promise<StudentTransportAssignmentEntity>;
}
