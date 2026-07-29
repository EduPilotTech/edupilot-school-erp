import { z } from "zod";
import type { HomeworkStatusValue } from "../../domain/homework-status.entity";

export const createHomeworkSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  classId: z.string().uuid("Class is required."),
  sectionId: z.string().uuid().optional(),
  subjectId: z.string().uuid("Subject is required."),
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().min(1, "Description is required.").max(5000),
  assignedDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  attachmentKey: z.string().trim().max(500).optional(),
});
export type CreateHomeworkServiceInput = z.infer<typeof createHomeworkSchema>;

export const setHomeworkStatusSchema = z.object({
  homeworkId: z.string().uuid("Homework is required."),
  studentId: z.string().uuid("Student is required."),
  status: z.enum(["PENDING", "SUBMITTED", "COMPLETED"]),
});
export type SetHomeworkStatusServiceInput = z.infer<typeof setHomeworkStatusSchema>;

export interface HomeworkDTO {
  id: string;
  academicSessionId: string;
  classId: string;
  sectionId: string | null;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  attachmentKey: string | null;
  isActive: boolean;
}

export interface HomeworkStatusDTO {
  id: string;
  homeworkId: string;
  studentId: string;
  status: HomeworkStatusValue;
}
