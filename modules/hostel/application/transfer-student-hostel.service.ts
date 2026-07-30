import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaHostelRoomRepository } from "../infrastructure/prisma-hostel-room.repository";
import { PrismaHostelBedRepository } from "../infrastructure/prisma-hostel-bed.repository";
import { PrismaStudentHostelAssignmentRepository } from "../infrastructure/prisma-student-hostel-assignment.repository";
import {
  BedNotAvailableError,
  GenderMismatchError,
  HostelBedNotFoundError,
  HostelRoomNotFoundError,
  InvalidHostelAssignmentError,
  StudentHostelAssignmentNotFoundError,
} from "../domain/errors";
import { isGenderCompatible } from "./hostel-gender.helpers";
import { transferStudentHostelSchema, type StudentHostelAssignmentDTO } from "./dto/student-hostel-assignment.dto";
import { toStudentHostelAssignmentDTO } from "./check-in-student-hostel.service";
import type { HostelContext } from "./create-hostel.service";

// A room/bed change mid-session — closes the current StudentHostelAssignment
// (checkOutDate=transferDate, status=TRANSFERRED) and opens a new one at the new room/bed in the
// same transaction, freeing the old bed and occupying the new one. Deliberately mirrors
// promoteStudents' own "close the old Enrollment, create the new one" shape (Phase 7 precedent) —
// this is what makes Transfer + History (this phase's own explicit requirement) a structural
// fact rather than an overwritten value.
export async function transferStudentHostel(
  input: unknown,
  context: HostelContext
): Promise<StudentHostelAssignmentDTO> {
  const parsed = transferStudentHostelSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid transfer data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const studentRepository = new PrismaStudentRepository();
  const student = await studentRepository.findById(tenantId, data.studentId);
  if (!student || student.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const assignmentRepository = new PrismaStudentHostelAssignmentRepository();
  const current = await assignmentRepository.findCurrentForStudent(tenantId, data.studentId, data.academicSessionId);
  if (!current) {
    throw new StudentHostelAssignmentNotFoundError();
  }

  const roomRepository = new PrismaHostelRoomRepository();
  const newRoom = await roomRepository.findById(tenantId, data.newRoomId);
  if (!newRoom || newRoom.deletedAt !== null) {
    throw new HostelRoomNotFoundError();
  }
  if (newRoom.status !== "ACTIVE") {
    throw new InvalidHostelAssignmentError("This room is not currently active for assignment.");
  }
  if (!isGenderCompatible(student.gender, newRoom.gender)) {
    throw new GenderMismatchError();
  }

  const bedRepository = new PrismaHostelBedRepository();
  const newBed = await bedRepository.findById(tenantId, data.newBedId);
  if (!newBed || newBed.deletedAt !== null || newBed.roomId !== data.newRoomId) {
    throw new HostelBedNotFoundError();
  }
  if (newBed.status !== "AVAILABLE") {
    throw new BedNotAvailableError();
  }
  if (newBed.id === current.bedId) {
    throw new InvalidHostelAssignmentError("The student is already assigned to this bed.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    await assignmentRepository.close(tenantId, current.id, data.transferDate, "TRANSFERRED", actingUserId, tx);
    await bedRepository.setStatus(tenantId, current.bedId, "AVAILABLE", tx);

    const newAssignment = await assignmentRepository.create(
      {
        tenantId,
        studentId: data.studentId,
        academicSessionId: data.academicSessionId,
        roomId: data.newRoomId,
        bedId: data.newBedId,
        dietPreference: current.dietPreference,
        checkInDate: data.transferDate,
        createdBy: actingUserId,
      },
      tx
    );
    await bedRepository.setStatus(tenantId, data.newBedId, "OCCUPIED", tx);

    return toStudentHostelAssignmentDTO(newAssignment);
  });
}
