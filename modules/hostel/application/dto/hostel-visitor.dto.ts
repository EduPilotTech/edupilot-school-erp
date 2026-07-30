import { z } from "zod";

export const logHostelVisitorSchema = z.object({
  studentId: z.string().uuid("Student is required."),
  visitorName: z.string().trim().min(1, "Visitor name is required."),
  relation: z.string().trim().min(1, "Relation is required."),
  purpose: z.string().trim().min(1, "Purpose is required.").max(500),
  entryTime: z.coerce.date(),
  approvedBy: z.string().uuid().optional(),
});
export type LogHostelVisitorServiceInput = z.infer<typeof logHostelVisitorSchema>;

export interface HostelVisitorDTO {
  id: string;
  studentId: string;
  visitorName: string;
  relation: string;
  purpose: string;
  entryTime: string;
  exitTime: string | null;
  approvedBy: string | null;
}
