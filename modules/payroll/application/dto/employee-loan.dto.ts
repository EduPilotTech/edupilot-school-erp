import { z } from "zod";
import type { EmployeeLoanStatusValue, EmployeeLoanTypeValue } from "../../domain/employee-loan.entity";

export const createEmployeeLoanSchema = z.object({
  employeeId: z.string().uuid("Employee is required."),
  loanType: z.enum(["LOAN", "ADVANCE"]),
  principalAmount: z.number().positive("Principal amount must be greater than zero."),
  monthlyRecoveryAmount: z.number().positive("Monthly recovery amount must be greater than zero."),
  startDate: z.coerce.date({ message: "A valid start date is required." }),
  reason: z.string().trim().max(500).optional(),
});
export type CreateEmployeeLoanServiceInput = z.infer<typeof createEmployeeLoanSchema>;

export interface EmployeeLoanDTO {
  id: string;
  employeeId: string;
  loanType: EmployeeLoanTypeValue;
  principalAmount: number;
  monthlyRecoveryAmount: number;
  outstandingAmount: number;
  startDate: string;
  status: EmployeeLoanStatusValue;
  reason: string | null;
}
