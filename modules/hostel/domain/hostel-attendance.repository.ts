import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  HostelAttendanceEntity,
  HostelAttendanceSessionValue,
  HostelAttendanceStatusValue,
} from "./hostel-attendance.entity";

export interface MarkHostelAttendanceInput {
  tenantId: string;
  studentId: string;
  studentHostelAssignmentId: string;
  roomId: string;
  academicSessionId: string;
  date: Date;
  session: HostelAttendanceSessionValue;
  status: HostelAttendanceStatusValue;
  remarks?: string | null;
  markedBy?: string | null;
}

// "One record per student per day per session-leg" is enforced by
// `@@unique([tenantId, studentId, date, session])` — mirrors TransportAttendanceRepository's own
// upsert-not-create shape exactly (re-marking corrects the existing row).
export interface HostelAttendanceRepository {
  markOne(input: MarkHostelAttendanceInput, tx?: Prisma.TransactionClient): Promise<HostelAttendanceEntity>;

  findByRoomAndDate(
    tenantId: string,
    roomId: string,
    date: Date,
    session: HostelAttendanceSessionValue
  ): Promise<HostelAttendanceEntity[]>;

  findByStudentAndDateRange(
    tenantId: string,
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HostelAttendanceEntity[]>;
}
