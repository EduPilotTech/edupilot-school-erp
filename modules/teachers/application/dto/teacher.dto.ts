import { z } from "zod";

export const createTeacherSchema = z.object({
  userProfileId: z.string().uuid("Invalid user id."),
  employeeCode: z.string().trim().min(1, "Employee code is required.").max(50),
  joiningDate: z.coerce.date(),
  qualification: z.string().trim().max(200).optional(),
});
export type CreateTeacherServiceInput = z.infer<typeof createTeacherSchema>;

export const updateTeacherSchema = z.object({
  employeeCode: z.string().trim().min(1).max(50).optional(),
  joiningDate: z.coerce.date().optional(),
  qualification: z.string().trim().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateTeacherServiceInput = z.infer<typeof updateTeacherSchema>;

// Joined display shape — Teacher's own teaching-specific fields plus the identity fields that
// live on UserProfile (never duplicated onto Teacher itself, per Decision 1).
export interface TeacherDTO {
  id: string;
  userProfileId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  employeeCode: string;
  joiningDate: Date;
  qualification: string | null;
  isActive: boolean;
}
