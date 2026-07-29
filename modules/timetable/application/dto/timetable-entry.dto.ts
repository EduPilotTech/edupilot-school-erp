import { z } from "zod";

const dayOfWeekSchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

export const createTimetableEntrySchema = z.object({
  teacherAssignmentId: z.string().uuid("A teacher assignment is required."),
  periodId: z.string().uuid("Period is required."),
  dayOfWeek: dayOfWeekSchema,
  classroomId: z.string().uuid("Invalid classroom id.").optional(),
});
export type CreateTimetableEntryServiceInput = z.infer<typeof createTimetableEntrySchema>;

export const updateTimetableEntrySchema = z.object({
  teacherAssignmentId: z.string().uuid("A teacher assignment is required."),
  classroomId: z.string().uuid("Invalid classroom id.").optional(),
});
export type UpdateTimetableEntryServiceInput = z.infer<typeof updateTimetableEntrySchema>;

export interface TimetableEntryDTO {
  id: string;
  teacherAssignmentId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  classroomId: string | null;
  periodId: string;
  dayOfWeek: string;
}
