import { z } from "zod";

export const upsertEmployeeBankDetailSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id."),
  accountHolderName: z.string().trim().min(1, "Account holder name is required.").max(200),
  accountNumber: z.string().trim().min(1, "Account number is required.").max(50),
  bankName: z.string().trim().min(1, "Bank name is required.").max(200),
  branchName: z.string().trim().max(200).optional(),
  ifscCode: z
    .string()
    .trim()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code."),
  accountType: z.string().trim().max(50).optional(),
});
export type UpsertEmployeeBankDetailServiceInput = z.infer<typeof upsertEmployeeBankDetailSchema>;

export interface EmployeeBankDetailDTO {
  id: string;
  employeeId: string;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  branchName: string | null;
  ifscCode: string;
  accountType: string | null;
}
