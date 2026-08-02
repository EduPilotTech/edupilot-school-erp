import { z } from "zod";

export const createAcademicSessionSchema = z
  .object({
    sessionName: z.string().trim().min(1, "Session name is required.").max(100),
    startDate: z.coerce.date({ message: "A valid start date is required." }),
    endDate: z.coerce.date({ message: "A valid end date is required." }),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date.",
    path: ["endDate"],
  });
export type CreateAcademicSessionServiceInput = z.infer<typeof createAcademicSessionSchema>;

export interface AcademicSessionDTO {
  id: string;
  sessionName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: string;
}
