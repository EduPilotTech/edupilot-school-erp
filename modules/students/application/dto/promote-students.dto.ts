import { z } from "zod";

// Phase 7 — Promotion Rules (Decision 2: reuses Enrollment.close()+create() directly, no
// Promotion model). One (source session -> target session) move per call, many students, each
// with their own target class/section — a student can be promoted to a different section than
// their classmates (e.g. re-sectioning on promotion), so target scope is per-entry, not shared.
export const promoteStudentsSchema = z.object({
  sourceAcademicSessionId: z.string().uuid("Source academic session is required."),
  targetAcademicSessionId: z.string().uuid("Target academic session is required."),
  promotions: z
    .array(
      z.object({
        studentId: z.string().uuid("Invalid student id."),
        targetClassId: z.string().uuid("Target class is required."),
        targetSectionId: z.string().uuid("Target section is required."),
        rollNumber: z.string().trim().max(50).optional(),
      })
    )
    .min(1, "At least one student is required."),
});
export type PromoteStudentsServiceInput = z.infer<typeof promoteStudentsSchema>;

export interface PromotionResultDTO {
  studentId: string;
  closedEnrollmentId: string;
  newEnrollmentId: string;
  targetClassId: string;
  targetSectionId: string;
}
