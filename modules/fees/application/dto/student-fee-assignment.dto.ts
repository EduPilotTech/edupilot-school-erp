import { z } from "zod";

export const assignStudentFeeSchema = z.object({
  studentId: z.string().uuid("Student is required."),
  academicSessionId: z.string().uuid("Academic session is required."),
  feeStructureId: z.string().uuid("Fee structure is required."),
  installmentPlanId: z.string().uuid().optional(),
});
export type AssignStudentFeeServiceInput = z.infer<typeof assignStudentFeeSchema>;

export interface StudentFeeAssignmentDTO {
  id: string;
  studentId: string;
  academicSessionId: string;
  feeStructureId: string;
  installmentPlanId: string | null;
  isActive: boolean;
}
