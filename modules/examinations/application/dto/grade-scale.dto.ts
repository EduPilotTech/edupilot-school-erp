import { z } from "zod";

export const setGradeScaleSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  name: z.string().trim().min(1).max(100).default("Default"),
  bands: z
    .array(
      z.object({
        minPercentage: z.number().min(0).max(100),
        maxPercentage: z.number().min(0).max(100),
        grade: z.string().trim().min(1, "Grade label is required.").max(10),
        gradePoint: z.number().optional(),
      })
    )
    .min(1, "At least one grade band is required."),
});
export type SetGradeScaleServiceInput = z.infer<typeof setGradeScaleSchema>;

export interface GradeBandDTO {
  minPercentage: number;
  maxPercentage: number;
  grade: string;
  gradePoint: number | null;
}

export interface GradeScaleDTO {
  id: string;
  academicSessionId: string;
  name: string;
  bands: GradeBandDTO[];
}
