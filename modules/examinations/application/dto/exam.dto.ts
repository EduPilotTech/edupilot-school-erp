import { z } from "zod";
import type { ExamStatusValue } from "../../domain/exam.entity";

const examStatusSchema = z.enum([
  "DRAFT",
  "SCHEDULED",
  "ONGOING",
  "MARKS_ENTRY_COMPLETED",
  "RESULT_GENERATED",
  "RESULT_PUBLISHED",
]);

export const createExamSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  examTypeId: z.string().uuid("Exam type is required."),
  gradeScaleId: z.string().uuid("Invalid grade scale id.").optional(),
  name: z.string().trim().min(1, "Exam name is required.").max(200),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
export type CreateExamServiceInput = z.infer<typeof createExamSchema>;

export const updateExamStatusSchema = z.object({
  status: examStatusSchema,
});
export type UpdateExamStatusServiceInput = z.infer<typeof updateExamStatusSchema>;

export interface ExamDTO {
  id: string;
  academicSessionId: string;
  examTypeId: string;
  gradeScaleId: string | null;
  name: string;
  startDate: Date;
  endDate: Date;
  status: ExamStatusValue;
}
