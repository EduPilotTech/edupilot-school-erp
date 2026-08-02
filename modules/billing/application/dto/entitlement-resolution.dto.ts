import { z } from "zod";

export const resolveEntitlementSchema = z.object({
  featureKey: z.string().trim().min(1, "Feature key is required."),
});
export type ResolveEntitlementServiceInput = z.infer<typeof resolveEntitlementSchema>;

export interface EntitlementResolutionDTO {
  featureKey: string;
  allowed: boolean;
  limit: number | null;
}
