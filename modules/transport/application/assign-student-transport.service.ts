import "server-only";
import { ValidationError } from "@/lib/errors";
import { StudentNotFoundError, InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaRouteRepository } from "../infrastructure/prisma-route.repository";
import { PrismaRouteStopRepository } from "../infrastructure/prisma-route-stop.repository";
import { PrismaStudentTransportAssignmentRepository } from "../infrastructure/prisma-student-transport-assignment.repository";
import { InvalidTransportAssignmentError, RouteNotFoundError, RouteStopNotFoundError } from "../domain/errors";
import { assignStudentTransportSchema, type StudentTransportAssignmentDTO } from "./dto/student-transport-assignment.dto";
import type { StudentTransportAssignmentEntity } from "../domain/student-transport-assignment.entity";
import type { TransportContext } from "./create-vehicle.service";

function toDTO(entity: StudentTransportAssignmentEntity): StudentTransportAssignmentDTO {
  return {
    id: entity.id,
    studentId: entity.studentId,
    academicSessionId: entity.academicSessionId,
    routeId: entity.routeId,
    stopId: entity.stopId,
    tripType: entity.tripType,
    status: entity.status,
  };
}

export async function assignStudentTransport(
  input: unknown,
  context: TransportContext
): Promise<StudentTransportAssignmentDTO> {
  const parsed = assignStudentTransportSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid transport assignment data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const studentRepository = new PrismaStudentRepository();
  const student = await studentRepository.findById(tenantId, data.studentId);
  if (!student || student.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  const routeRepository = new PrismaRouteRepository();
  const route = await routeRepository.findById(tenantId, data.routeId);
  if (!route || route.deletedAt !== null) {
    throw new RouteNotFoundError();
  }

  const stopRepository = new PrismaRouteStopRepository();
  const stop = await stopRepository.findById(tenantId, data.stopId);
  if (!stop || stop.deletedAt !== null) {
    throw new RouteStopNotFoundError();
  }
  if (stop.routeId !== data.routeId) {
    throw new InvalidTransportAssignmentError("The selected stop does not belong to the selected route.");
  }

  const repository = new PrismaStudentTransportAssignmentRepository();
  const assignment = await repository.upsertForStudent({
    tenantId,
    studentId: data.studentId,
    academicSessionId: data.academicSessionId,
    routeId: data.routeId,
    stopId: data.stopId,
    tripType: data.tripType,
    createdBy: actingUserId,
  });
  return toDTO(assignment);
}

export { toDTO as toStudentTransportAssignmentDTO };
