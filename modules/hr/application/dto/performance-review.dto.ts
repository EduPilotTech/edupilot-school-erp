import { z } from "zod";

export const createPerformanceReviewSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id."),
  reviewPeriodStart: z.coerce.date(),
  reviewPeriodEnd: z.coerce.date(),
  rating: z.number().int().min(1, "Rating must be between 1 and 5.").max(5, "Rating must be between 1 and 5."),
  remarks: z.string().trim().max(2000).optional(),
  promotionRecommended: z.boolean().optional(),
  reviewedBy: z.string().uuid().optional(),
});
export type CreatePerformanceReviewServiceInput = z.infer<typeof createPerformanceReviewSchema>;

export interface PerformanceReviewDTO {
  id: string;
  employeeId: string;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  rating: number;
  remarks: string | null;
  promotionRecommended: boolean;
  reviewedBy: string | null;
}
