import { z } from "zod";

export const createSectionSchema = z.object({
  classId: z.string().uuid("A valid class is required."),
  name: z.string().trim().min(1, "Section name is required.").max(50),
  capacity: z.coerce.number().int().positive().optional(),
});
export type CreateSectionServiceInput = z.infer<typeof createSectionSchema>;

export interface SectionDTO {
  id: string;
  classId: string;
  name: string;
  capacity: number | null;
}
