import { z } from "zod";

export const createClassSchema = z.object({
  academicSessionId: z.string().uuid("A valid academic session is required."),
  name: z.string().trim().min(1, "Class name is required.").max(100),
  grade: z.coerce.number().int().min(0).max(20).optional(),
});
export type CreateClassServiceInput = z.infer<typeof createClassSchema>;

export interface ClassDTO {
  id: string;
  academicSessionId: string;
  name: string;
  grade: number | null;
}
