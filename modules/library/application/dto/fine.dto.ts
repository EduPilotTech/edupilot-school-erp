import { z } from "zod";

export const generateLibraryFineInvoiceSchema = z.object({
  feeCategoryId: z.string().uuid("Fee category is required."),
  overrideAmount: z.number().min(0).optional(),
});
export type GenerateLibraryFineInvoiceServiceInput = z.infer<typeof generateLibraryFineInvoiceSchema>;

export interface LibraryFineEstimateDTO {
  bookIssueId: string;
  reason: "LATE" | "LOST" | "DAMAGED" | "NONE";
  amount: number;
}
