import type { Prisma } from "@/lib/generated/prisma/client";
import type { DayOfWeekValue } from "./working-day.entity";
import type { TimetableEntryEntity } from "./timetable-entry.entity";

export interface CreateTimetableEntryInput {
  tenantId: string;
  teacherAssignmentId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  classroomId?: string | null;
  periodId: string;
  dayOfWeek: DayOfWeekValue;
  createdBy?: string | null;
}

export interface UpdateTimetableEntryInput {
  teacherAssignmentId: string;
  subjectId: string;
  teacherId: string;
  classroomId?: string | null;
  updatedBy?: string | null;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6 — no ambient tenant
// context, never trusted from a caller's request. The three `findBy*Slot` methods back the
// service-layer conflict pre-checks (architecture review §K); the three `findBy(Class|Teacher|
// Classroom)` methods back the three print/report views.
export interface TimetableEntryRepository {
  findById(tenantId: string, id: string): Promise<TimetableEntryEntity | null>;
  findBySectionSlot(
    tenantId: string,
    sectionId: string,
    dayOfWeek: DayOfWeekValue,
    periodId: string
  ): Promise<TimetableEntryEntity | null>;
  findByTeacherSlot(
    tenantId: string,
    teacherId: string,
    dayOfWeek: DayOfWeekValue,
    periodId: string
  ): Promise<TimetableEntryEntity | null>;
  findByClassroomSlot(
    tenantId: string,
    classroomId: string,
    dayOfWeek: DayOfWeekValue,
    periodId: string
  ): Promise<TimetableEntryEntity | null>;
  findByClass(
    tenantId: string,
    classId: string,
    sectionId: string,
    academicSessionId: string
  ): Promise<TimetableEntryEntity[]>;
  findByTeacher(tenantId: string, teacherId: string, academicSessionId: string): Promise<TimetableEntryEntity[]>;
  findByClassroom(
    tenantId: string,
    classroomId: string,
    academicSessionId: string
  ): Promise<TimetableEntryEntity[]>;
  // Backs remove-assignment.service.ts's Phase 6.1 guard — whether any active TimetableEntry
  // still references a given TeacherAssignment, i.e. whether deactivating that assignment would
  // orphan a live timetable slot.
  existsActiveByAssignment(tenantId: string, teacherAssignmentId: string): Promise<boolean>;
  create(input: CreateTimetableEntryInput, tx?: Prisma.TransactionClient): Promise<TimetableEntryEntity>;
  update(
    tenantId: string,
    id: string,
    input: UpdateTimetableEntryInput,
    tx?: Prisma.TransactionClient
  ): Promise<TimetableEntryEntity>;
  delete(tenantId: string, id: string): Promise<void>;
}
