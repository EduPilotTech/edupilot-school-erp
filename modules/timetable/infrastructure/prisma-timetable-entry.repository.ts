import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, TimetableEntry as PrismaTimetableEntry } from "@/lib/generated/prisma/client";
import type {
  CreateTimetableEntryInput,
  TimetableEntryRepository,
  UpdateTimetableEntryInput,
} from "../domain/timetable-entry.repository";
import type { DayOfWeekValue } from "../domain/working-day.entity";
import type { TimetableEntryEntity } from "../domain/timetable-entry.entity";

function toEntity(row: PrismaTimetableEntry): TimetableEntryEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    teacherAssignmentId: row.teacherAssignmentId,
    academicSessionId: row.academicSessionId,
    classId: row.classId,
    sectionId: row.sectionId,
    subjectId: row.subjectId,
    teacherId: row.teacherId,
    classroomId: row.classroomId,
    periodId: row.periodId,
    dayOfWeek: row.dayOfWeek as DayOfWeekValue,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaTimetableEntryRepository implements TimetableEntryRepository {
  async findById(tenantId: string, id: string): Promise<TimetableEntryEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.timetableEntry.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findBySectionSlot(
    tenantId: string,
    sectionId: string,
    dayOfWeek: DayOfWeekValue,
    periodId: string
  ): Promise<TimetableEntryEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.timetableEntry.findUnique({
        where: { unique_section_slot: { tenantId, sectionId, dayOfWeek, periodId } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByTeacherSlot(
    tenantId: string,
    teacherId: string,
    dayOfWeek: DayOfWeekValue,
    periodId: string
  ): Promise<TimetableEntryEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.timetableEntry.findUnique({
        where: { unique_teacher_slot: { tenantId, teacherId, dayOfWeek, periodId } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByClassroomSlot(
    tenantId: string,
    classroomId: string,
    dayOfWeek: DayOfWeekValue,
    periodId: string
  ): Promise<TimetableEntryEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.timetableEntry.findUnique({
        where: { unique_classroom_slot: { tenantId, classroomId, dayOfWeek, periodId } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByClass(
    tenantId: string,
    classId: string,
    sectionId: string,
    academicSessionId: string
  ): Promise<TimetableEntryEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.timetableEntry.findMany({
        where: { tenantId, classId, sectionId, academicSessionId, isActive: true },
        orderBy: [{ dayOfWeek: "asc" }, { period: { periodNumber: "asc" } }],
      })
    );
    return rows.map(toEntity);
  }

  async findByTeacher(
    tenantId: string,
    teacherId: string,
    academicSessionId: string
  ): Promise<TimetableEntryEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.timetableEntry.findMany({
        where: { tenantId, teacherId, academicSessionId, isActive: true },
        orderBy: [{ dayOfWeek: "asc" }, { period: { periodNumber: "asc" } }],
      })
    );
    return rows.map(toEntity);
  }

  async findByClassroom(
    tenantId: string,
    classroomId: string,
    academicSessionId: string
  ): Promise<TimetableEntryEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.timetableEntry.findMany({
        where: { tenantId, classroomId, academicSessionId, isActive: true },
        orderBy: [{ dayOfWeek: "asc" }, { period: { periodNumber: "asc" } }],
      })
    );
    return rows.map(toEntity);
  }

  async existsActiveByAssignment(tenantId: string, teacherAssignmentId: string): Promise<boolean> {
    const count = await withTenantContext(tenantId, (tx) =>
      tx.timetableEntry.count({ where: { tenantId, teacherAssignmentId, isActive: true } })
    );
    return count > 0;
  }

  async create(
    input: CreateTimetableEntryInput,
    tx?: Prisma.TransactionClient
  ): Promise<TimetableEntryEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (t) =>
        t.timetableEntry.create({
          data: {
            tenantId: input.tenantId,
            teacherAssignmentId: input.teacherAssignmentId,
            academicSessionId: input.academicSessionId,
            classId: input.classId,
            sectionId: input.sectionId,
            subjectId: input.subjectId,
            teacherId: input.teacherId,
            classroomId: input.classroomId ?? null,
            periodId: input.periodId,
            dayOfWeek: input.dayOfWeek,
            createdBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateTimetableEntryInput,
    tx?: Prisma.TransactionClient
  ): Promise<TimetableEntryEntity> {
    const row = await withTenantContext(
      tenantId,
      (t) =>
        t.timetableEntry.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            teacherAssignmentId: input.teacherAssignmentId,
            subjectId: input.subjectId,
            teacherId: input.teacherId,
            classroomId: input.classroomId ?? null,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await withTenantContext(tenantId, (tx) =>
      tx.timetableEntry.delete({ where: { tenantId_id: { tenantId, id } } })
    );
  }
}
