import { z } from "zod";

export const inviteUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  fullName: z.string().trim().min(1, "Full name is required.").max(200, "Full name is too long."),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
