import { z } from "zod";

// Fed from URL searchParams (Sprint 4 — Step 5), same convention as
// modules/users/application/dto/list-users.dto.ts: `z.coerce` handles values arriving as
// strings, and every field is optional/defaulted so a malformed or empty query string still
// parses to sensible defaults rather than needing a thrown error for a navigation concern.
export const listStudentsFilterSchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(["ACTIVE", "TRANSFERRED", "GRADUATED", "WITHDRAWN"]).optional(),
  academicSessionId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  sortBy: z.enum(["admissionNumber", "name", "admissionDate"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListStudentsFilter = z.infer<typeof listStudentsFilterSchema>;
