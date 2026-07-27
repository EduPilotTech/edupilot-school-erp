import { z } from "zod";

export const restoreUserSchema = z.object({
  userId: z.string().uuid("Invalid user id."),
});

export type RestoreUserInput = z.infer<typeof restoreUserSchema>;
