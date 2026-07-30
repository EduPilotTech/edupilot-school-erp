import { z } from "zod";

const hostelTypeEnum = z.enum(["BOYS", "GIRLS", "CO_ED"]);

export const createHostelSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  code: z.string().trim().min(1, "Code is required."),
  type: hostelTypeEnum,
  address: z.string().trim().max(500).optional(),
});
export type CreateHostelServiceInput = z.infer<typeof createHostelSchema>;

export const updateHostelSchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  type: hostelTypeEnum.optional(),
  address: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateHostelServiceInput = z.infer<typeof updateHostelSchema>;

export interface HostelDTO {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  type: string;
  address: string | null;
  isActive: boolean;
}
