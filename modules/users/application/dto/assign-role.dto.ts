import { z } from "zod";

// Schema only this sprint — no assign-role service is implemented yet (not part of this
// step's approved scope). Exists so the input shape is fixed now for whichever future step
// builds the service, and so "Cannot assign role across tenants" (Sprint 3 — Step 1 Part F)
// has a documented contract to enforce against once that service exists.
export const assignRoleSchema = z.object({
  userId: z.string().uuid("Invalid user id."),
  roleId: z.string().uuid("Invalid role id."),
});

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
