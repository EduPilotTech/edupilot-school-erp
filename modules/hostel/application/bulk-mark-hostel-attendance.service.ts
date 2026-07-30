import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaStudentGuardianRepository } from "@/modules/students/infrastructure/prisma-student-guardian.repository";
import { PrismaGuardianRepository } from "@/modules/students/infrastructure/prisma-guardian.repository";
import { dispatchNotification } from "@/modules/communication/application/dispatch-notification.helpers";
import { PrismaHostelRoomRepository } from "../infrastructure/prisma-hostel-room.repository";
import { PrismaStudentHostelAssignmentRepository } from "../infrastructure/prisma-student-hostel-assignment.repository";
import { PrismaHostelAttendanceRepository } from "../infrastructure/prisma-hostel-attendance.repository";
import { HostelRoomNotFoundError, StudentHostelAssignmentNotFoundError } from "../domain/errors";
import { bulkMarkHostelAttendanceSchema, type HostelAttendanceDTO } from "./dto/hostel-attendance.dto";

export interface BulkMarkHostelAttendanceContext {
  tenantId: string;
  actingUserId: string;
}

const SESSION_LABEL: Record<string, string> = { MORNING: "morning", NIGHT: "night" };

// Decision — reuses the existing notification infrastructure exactly as
// bulk-mark-transport-attendance.service.ts does: resolve every guardian linked to this student
// with portal access, notify each. Only ABSENT triggers a notification.
async function notifyGuardiansOfAbsence(
  tenantId: string,
  studentId: string,
  roomLabel: string,
  session: string,
  tx: Prisma.TransactionClient
): Promise<void> {
  const studentGuardianRepository = new PrismaStudentGuardianRepository();
  const guardianRepository = new PrismaGuardianRepository();
  const links = await studentGuardianRepository.listForStudent(tenantId, studentId);

  const leg = SESSION_LABEL[session] ?? session.toLowerCase();
  const title = "Hostel: student marked absent";
  const body = `Your child was marked absent at the ${leg} hostel roll call (room ${roomLabel}).`;

  for (const link of links) {
    const guardian = await guardianRepository.findById(tenantId, link.guardianId);
    if (!guardian?.userProfileId) continue;
    await dispatchNotification(
      {
        tenantId,
        recipientUserProfileId: guardian.userProfileId,
        type: "ATTENDANCE_ALERT",
        priority: "HIGH",
        title,
        body,
        referenceType: "HostelAttendance",
        referenceId: studentId,
      },
      tx
    );
  }
}

// Bulk Mark Hostel Attendance: one room/date/session, many students, marked atomically — mirrors
// bulkMarkTransportAttendance.service.ts's own shape. roomId/studentHostelAssignmentId are
// resolved once per student from the room's current occupants, then denormalized onto each
// HostelAttendance row.
export async function bulkMarkHostelAttendance(
  input: unknown,
  context: BulkMarkHostelAttendanceContext
): Promise<HostelAttendanceDTO[]> {
  const parsed = bulkMarkHostelAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid hostel attendance data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const roomRepository = new PrismaHostelRoomRepository();
  const room = await roomRepository.findById(tenantId, data.roomId);
  if (!room || room.deletedAt !== null) {
    throw new HostelRoomNotFoundError();
  }

  const assignmentRepository = new PrismaStudentHostelAssignmentRepository();
  const occupants = await assignmentRepository.findCurrentForRoom(tenantId, data.roomId);
  const assignmentByStudentId = new Map(occupants.map((assignment) => [assignment.studentId, assignment]));

  const attendanceRepository = new PrismaHostelAttendanceRepository();

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

      const results: HostelAttendanceDTO[] = [];
      for (const entry of data.entries) {
        const assignment = assignmentByStudentId.get(entry.studentId);
        if (!assignment) {
          throw new StudentHostelAssignmentNotFoundError();
        }

        const attendance = await attendanceRepository.markOne(
          {
            tenantId,
            studentId: entry.studentId,
            studentHostelAssignmentId: assignment.id,
            roomId: data.roomId,
            academicSessionId: data.academicSessionId,
            date: data.date,
            session: data.session,
            status: entry.status,
            remarks: entry.remarks ?? null,
            markedBy: actingUserId,
          },
          tx
        );

        if (attendance.status === "ABSENT") {
          await notifyGuardiansOfAbsence(tenantId, entry.studentId, room.roomNumber, data.session, tx);
        }

        results.push({
          id: attendance.id,
          studentId: attendance.studentId,
          studentHostelAssignmentId: attendance.studentHostelAssignmentId,
          roomId: attendance.roomId,
          date: attendance.date.toISOString().slice(0, 10),
          session: attendance.session,
          status: attendance.status,
          remarks: attendance.remarks,
          markedBy: attendance.markedBy,
        });
      }
      return results;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new StudentNotFoundError();
    }
    throw error;
  }
}
