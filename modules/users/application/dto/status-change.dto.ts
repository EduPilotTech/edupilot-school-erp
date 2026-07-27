import { z } from "zod";

// Shared input shape for suspend/activate/deactivate — and reused as-is by delete-user.service
// (soft delete), since its input is identical (which user, optional reason); a distinct DTO for
// delete would just duplicate this one field-for-field.
export const statusChangeSchema = z.object({
  userId: z.string().uuid("Invalid user id."),
  reason: z.string().trim().max(500, "Reason is too long.").optional(),
});

export type StatusChangeInput = z.infer<typeof statusChangeSchema>;
