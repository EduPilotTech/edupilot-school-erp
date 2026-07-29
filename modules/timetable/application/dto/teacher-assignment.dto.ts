import { z } from "zod";

export const assignTeacherSchema = z.object({
  teacherId: z.string().uuid("Invalid teacher id."),
  subjectId: z.string().uuid("Subject is required."),
  academicSessionId: z.string().uuid("Academic session is required."),
  classId: z.string().uuid("Class is required."),
  sectionId: z.string().uuid("Section is required."),
});
export type AssignTeacherServiceInput = z.infer<typeof assignTeacherSchema>;

export interface TeacherAssignmentDTO {
  id: string;
  teacherId: string;
  subjectId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  isActive: boolean;
}
