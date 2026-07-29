import { z } from "zod";

export const createExamTypeSchema = z.object({
  name: z.string().trim().min(1, "Exam type name is required.").max(200),
  code: z.string().trim().min(1, "Exam type code is required.").max(50),
});
export type CreateExamTypeServiceInput = z.infer<typeof createExamTypeSchema>;

export const updateExamTypeSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  code: z.string().trim().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateExamTypeServiceInput = z.infer<typeof updateExamTypeSchema>;

export interface ExamTypeDTO {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}
