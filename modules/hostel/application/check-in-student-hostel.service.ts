import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { StudentNotFoundError, InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaHostelRoomRepository } from "../infrastructure/prisma-hostel-room.repository";
import { PrismaHostelBedRepository } from "../infrastructure/prisma-hostel-bed.repository";
import { PrismaStudentHostelAssignmentRepository } from "../infrastructure/prisma-student-hostel-assignment.repository";
import {
  BedNotAvailableError,
  GenderMismatchError,
  HostelBedNotFoundError,
  HostelRoomNotFoundError,
  InvalidHostelAssignmentError,
  StudentAlreadyAssignedError,
} from "../domain/errors";
import { isGenderCompatible } from "./hostel-gender.helpers";
import { checkInStudentHostelSchema, type StudentHostelAssignmentDTO } from "./dto/student-hostel-assignment.dto";
import type { StudentHostelAssignmentEntity } from "../domain/student-hostel-assignment.entity";
import type { HostelContext } from "./create-hostel.service";

function toDTO(entity: StudentHostelAssignmentEntity): StudentHostelAssignmentDTO {
  return {
    id: entity.id,
    studentId: entity.studentId,
    academicSessionId: entity.academicSessionId,
    roomId: entity.roomId,
    bedId: entity.bedId,
    dietPreference: entity.dietPreference,
    checkInDate: entity.checkInDate.toISOString().slice(0, 10),
    checkOutDate: entity.checkOutDate ? entity.checkOutDate.toISOString().slice(0, 10) : null,
    status: entity.status,
  };
}

// The first, session-opening assignment for a student — atomically creates the
// StudentHostelAssignment row and flips the chosen bed to OCCUPIED (Decision: bed status is
// transactionally maintained, never derived at read time — see HostelBedEntity's own comment).
export async function checkInStudentHostel(
  input: unknown,
  context: HostelContext
): Promise<StudentHostelAssignmentDTO> {
  const parsed = checkInStudentHostelSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid check-in data.");
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

  const assignmentRepository = new PrismaStudentHostelAssignmentRepository();
  const existingAssignment = await assignmentRepository.findCurrentForStudent(
    tenantId,
    data.studentId,
    data.academicSessionId
  );
  if (existingAssignment) {
    throw new StudentAlreadyAssignedError();
  }

  const roomRepository = new PrismaHostelRoomRepository();
  const room = await roomRepository.findById(tenantId, data.roomId);
  if (!room || room.deletedAt !== null) {
    throw new HostelRoomNotFoundError();
  }
  if (room.status !== "ACTIVE") {
    throw new InvalidHostelAssignmentError("This room is not currently active for assignment.");
  }
  if (!isGenderCompatible(student.gender, room.gender)) {
    throw new GenderMismatchError();
  }

  const bedRepository = new PrismaHostelBedRepository();
  const bed = await bedRepository.findById(tenantId, data.bedId);
  if (!bed || bed.deletedAt !== null || bed.roomId !== data.roomId) {
    throw new HostelBedNotFoundError();
  }
  if (bed.status !== "AVAILABLE") {
    throw new BedNotAvailableError();
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const assignment = await assignmentRepository.create(
      {
        tenantId,
        studentId: data.studentId,
        academicSessionId: data.academicSessionId,
        roomId: data.roomId,
        bedId: data.bedId,
        dietPreference: data.dietPreference ?? null,
        checkInDate: data.checkInDate,
        createdBy: actingUserId,
      },
      tx
    );

    await bedRepository.setStatus(tenantId, data.bedId, "OCCUPIED", tx);

    return toDTO(assignment);
  });
}

export { toDTO as toStudentHostelAssignmentDTO };
