import { z } from "zod";

const feeFrequencyEnum = z.enum(["ONE_TIME", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL", "INSTALLMENT"]);
const roomTypeEnum = z.enum(["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY", "OTHER"]);

export const createHostelFeeRuleSchema = z.object({
  hostelId: z.string().uuid("Hostel is required."),
  roomType: roomTypeEnum,
  academicSessionId: z.string().uuid("Academic session is required."),
  feeCategoryId: z.string().uuid("Fee category is required."),
  amount: z.number().positive("Amount must be greater than 0."),
  frequency: feeFrequencyEnum,
});
export type CreateHostelFeeRuleServiceInput = z.infer<typeof createHostelFeeRuleSchema>;

export const updateHostelFeeRuleSchema = z.object({
  amount: z.number().positive().optional(),
  frequency: feeFrequencyEnum.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateHostelFeeRuleServiceInput = z.infer<typeof updateHostelFeeRuleSchema>;

export const generateHostelMonthlyInvoicesSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  billingPeriod: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Billing period must be in YYYY-MM format."),
});
export type GenerateHostelMonthlyInvoicesServiceInput = z.infer<typeof generateHostelMonthlyInvoicesSchema>;

export const generateHostelOneTimeInvoiceSchema = z.object({
  studentId: z.string().uuid("Student is required."),
  hostelFeeRuleId: z.string().uuid("Hostel fee rule is required."),
});
export type GenerateHostelOneTimeInvoiceServiceInput = z.infer<typeof generateHostelOneTimeInvoiceSchema>;

export interface HostelFeeRuleDTO {
  id: string;
  hostelId: string;
  roomType: string;
  academicSessionId: string;
  feeCategoryId: string;
  amount: number;
  frequency: string;
  isActive: boolean;
}
