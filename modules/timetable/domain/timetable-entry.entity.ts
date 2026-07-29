import type { DayOfWeekValue } from "./working-day.entity";

// No `deletedAt` — see prisma/schema.prisma's TimetableEntry comment: reassigning a slot updates
// the existing row, clearing a slot is a real delete. Neither needs soft-delete/partial-index
// handling since the row is never duplicated over an old one.
export interface TimetableEntryEntity {
  id: string;
  tenantId: string;
  teacherAssignmentId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  classroomId: string | null;
  periodId: string;
  dayOfWeek: DayOfWeekValue;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
