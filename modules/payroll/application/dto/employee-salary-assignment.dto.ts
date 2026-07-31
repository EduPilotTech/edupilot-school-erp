import { z } from "zod";

export const assignSalarySchema = z.object({
  employeeId: z.string().uuid("Employee is required."),
  salaryStructureId: z.string().uuid("Salary structure is required."),
  basicSalary: z.number().positive("Basic salary must be greater than zero."),
  effectiveFrom: z.coerce.date({ message: "A valid effective-from date is required." }),
});
export type AssignSalaryServiceInput = z.infer<typeof assignSalarySchema>;

export interface EmployeeSalaryAssignmentDTO {
  id: string;
  employeeId: string;
  salaryStructureId: string;
  basicSalary: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}
