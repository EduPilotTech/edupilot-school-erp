import { z } from "zod";

export const createClassroomSchema = z.object({
  name: z.string().trim().min(1, "Classroom name is required.").max(200),
  code: z.string().trim().min(1, "Classroom code is required.").max(50),
  capacity: z.coerce.number().int().positive().optional(),
});
export type CreateClassroomServiceInput = z.infer<typeof createClassroomSchema>;

export const updateClassroomSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  code: z.string().trim().min(1).max(50).optional(),
  capacity: z.coerce.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateClassroomServiceInput = z.infer<typeof updateClassroomSchema>;

export interface ClassroomDTO {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  capacity: number | null;
  isActive: boolean;
}
