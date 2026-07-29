import { z } from "zod";

export const createInstallmentPlanSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  name: z.string().trim().min(1, "Name is required."),
  items: z
    .array(
      z.object({
        installmentNumber: z.number().int().positive(),
        percentageOfTotal: z.number().positive().max(100),
        dueDayOffset: z.number().int().min(0),
      })
    )
    .min(1, "At least one installment is required."),
});
export type CreateInstallmentPlanServiceInput = z.infer<typeof createInstallmentPlanSchema>;

export interface InstallmentPlanItemDTO {
  id: string;
  installmentPlanId: string;
  installmentNumber: number;
  percentageOfTotal: number;
  dueDayOffset: number;
}

export interface InstallmentPlanDTO {
  id: string;
  academicSessionId: string;
  name: string;
  isActive: boolean;
  items: InstallmentPlanItemDTO[];
}
