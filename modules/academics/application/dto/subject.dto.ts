import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required.").max(200),
  code: z.string().trim().min(1, "Subject code is required.").max(50),
});
export type CreateSubjectServiceInput = z.infer<typeof createSubjectSchema>;

export const updateSubjectSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  code: z.string().trim().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateSubjectServiceInput = z.infer<typeof updateSubjectSchema>;

export interface SubjectDTO {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  isActive: boolean;
}
