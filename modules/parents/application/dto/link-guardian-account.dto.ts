import { z } from "zod";

export const linkGuardianAccountSchema = z.object({
  guardianId: z.string().uuid("Guardian is required."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").optional(),
});
export type LinkGuardianAccountServiceInput = z.infer<typeof linkGuardianAccountSchema>;
