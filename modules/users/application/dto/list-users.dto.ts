import { z } from "zod";

// `z.coerce.number()` handles URL searchParams arriving as strings. Every field is optional or
// defaulted, so an empty/malformed searchParams object still parses to sensible defaults rather
// than needing a thrown validation error for what is, here, a read/navigation concern, not a
// user-facing form submission.
export const listUsersFilterSchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(["INVITED", "ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
  roleId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListUsersFilter = z.infer<typeof listUsersFilterSchema>;
