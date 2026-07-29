import "server-only";
import { PrismaSubjectRepository } from "@/modules/academics/infrastructure/prisma-subject.repository";
import { PrismaClassroomRepository } from "@/modules/academics/infrastructure/prisma-classroom.repository";
import { PrismaClassRepository } from "@/modules/academics/infrastructure/prisma-class.repository";
import { PrismaSectionRepository } from "@/modules/academics/infrastructure/prisma-section.repository";
import { PrismaTeacherRepository } from "@/modules/teachers/infrastructure/prisma-teacher.repository";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { PrismaPeriodConfigurationRepository } from "../infrastructure/prisma-period-configuration.repository";
import type { TimetableEntryEntity } from "../domain/timetable-entry.entity";
import type { TimetableGridEntryDTO } from "./dto/timetable-grid.dto";

function toTimeString(date: Date): string {
  return date.toISOString().slice(11, 16);
}

function uniqueIds(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => value !== null))];
}

// Shared by getClassTimetable/getTeacherTimetable/getClassroomTimetable — joins the raw
// TimetableEntry rows against Subject/Classroom (modules/academics), Teacher+UserProfile
// (modules/teachers + modules/users), Class/Section (modules/academics), and
// PeriodConfiguration (this module) for print/display. Deduplicates ids before fetching, so a
// class with 30 periods a week still only fetches each distinct subject/teacher/classroom once —
// not true batch queries (no cross-module bulk-lookup service exists yet), but bounded by the
// tenant's small master-data cardinality, same trade-off as list-teachers.service.ts's own join.
export async function enrichTimetableEntries(
  tenantId: string,
  entries: TimetableEntryEntity[]
): Promise<TimetableGridEntryDTO[]> {
  const subjectRepository = new PrismaSubjectRepository();
  const classroomRepository = new PrismaClassroomRepository();
  const classRepository = new PrismaClassRepository();
  const sectionRepository = new PrismaSectionRepository();
  const teacherRepository = new PrismaTeacherRepository();
  const periodRepository = new PrismaPeriodConfigurationRepository();

  const [subjects, classrooms, classes, sections, teachers, periods] = await Promise.all([
    Promise.all(uniqueIds(entries.map((e) => e.subjectId)).map((id) => subjectRepository.findById(tenantId, id))),
    Promise.all(
      uniqueIds(entries.map((e) => e.classroomId)).map((id) => classroomRepository.findById(tenantId, id))
    ),
    Promise.all(uniqueIds(entries.map((e) => e.classId)).map((id) => classRepository.findById(tenantId, id))),
    Promise.all(uniqueIds(entries.map((e) => e.sectionId)).map((id) => sectionRepository.findById(tenantId, id))),
    Promise.all(uniqueIds(entries.map((e) => e.teacherId)).map((id) => teacherRepository.findById(tenantId, id))),
    Promise.all(uniqueIds(entries.map((e) => e.periodId)).map((id) => periodRepository.findById(tenantId, id))),
  ]);

  const teacherProfiles = await Promise.all(
    teachers
      .filter((teacher): teacher is NonNullable<typeof teacher> => teacher !== null)
      .map(async (teacher) => ({ teacherId: teacher.id, detail: await getUserDetail(teacher.userProfileId, { tenantId }) }))
  );

  const subjectMap = new Map(subjects.filter((s) => s !== null).map((s) => [s.id, s]));
  const classroomMap = new Map(classrooms.filter((c) => c !== null).map((c) => [c.id, c]));
  const classMap = new Map(classes.filter((c) => c !== null).map((c) => [c.id, c]));
  const sectionMap = new Map(sections.filter((s) => s !== null).map((s) => [s.id, s]));
  const periodMap = new Map(periods.filter((p) => p !== null).map((p) => [p.id, p]));
  const teacherNameMap = new Map(
    teacherProfiles.map(({ teacherId, detail }) => [teacherId, detail?.profile.fullName ?? "Unknown Teacher"])
  );

  return entries.map((entry) => {
    const period = periodMap.get(entry.periodId);
    return {
      id: entry.id,
      dayOfWeek: entry.dayOfWeek,
      periodNumber: period?.periodNumber ?? 0,
      startTime: period ? toTimeString(period.startTime) : "",
      endTime: period ? toTimeString(period.endTime) : "",
      subjectName: subjectMap.get(entry.subjectId)?.name ?? "Unknown Subject",
      teacherName: teacherNameMap.get(entry.teacherId) ?? "Unknown Teacher",
      className: classMap.get(entry.classId)?.name ?? "Unknown Class",
      sectionName: sectionMap.get(entry.sectionId)?.name ?? "Unknown Section",
      classroomName: entry.classroomId ? (classroomMap.get(entry.classroomId)?.name ?? null) : null,
    };
  });
}
