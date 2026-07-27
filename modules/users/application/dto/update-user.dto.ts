import { z } from "zod";

// email is deliberately not editable here — it's a synced cache of auth.users.email
// (lib/supabase, Sprint 2), and changing it must go through Supabase's own change-email flow,
// not a plain profile edit (see Sprint 3 — Step 1 §5).
export const updateUserProfileSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(200, "Full name is too long.").optional(),
  phone: z.string().trim().max(30, "Phone number is too long.").nullable().optional(),
  avatarUrl: z.string().trim().url("Enter a valid URL.").nullable().optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
