import { z } from "zod";

const feeFrequencyEnum = z.enum(["ONE_TIME", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL", "INSTALLMENT"]);

export const createRouteFeeRuleSchema = z.object({
  routeId: z.string().uuid("Route is required."),
  academicSessionId: z.string().uuid("Academic session is required."),
  feeCategoryId: z.string().uuid("Fee category is required."),
  amount: z.number().positive("Amount must be greater than 0."),
  frequency: feeFrequencyEnum,
});
export type CreateRouteFeeRuleServiceInput = z.infer<typeof createRouteFeeRuleSchema>;

export const updateRouteFeeRuleSchema = z.object({
  amount: z.number().positive().optional(),
  frequency: feeFrequencyEnum.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateRouteFeeRuleServiceInput = z.infer<typeof updateRouteFeeRuleSchema>;

export const generateTransportInvoicesSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  billingPeriod: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Billing period must be in YYYY-MM format."),
});
export type GenerateTransportInvoicesServiceInput = z.infer<typeof generateTransportInvoicesSchema>;

export interface RouteFeeRuleDTO {
  id: string;
  routeId: string;
  academicSessionId: string;
  feeCategoryId: string;
  amount: number;
  frequency: string;
  isActive: boolean;
}
