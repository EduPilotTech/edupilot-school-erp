import { z } from "zod";

export const enterMarksSchema = z.object({
  examSubjectId: z.string().uuid("Exam subject is required."),
  studentId: z.string().uuid("Invalid student id."),
  marksObtained: z.number().nonnegative().optional(),
  isAbsent: z.boolean().default(false),
  remarks: z.string().trim().max(500).optional(),
});
export type EnterMarksServiceInput = z.infer<typeof enterMarksSchema>;

// Bulk Marks Entry: one examSubject shared by every entry — matches a class-roster UI where the
// teacher picks the subject once, then enters a mark per student, not per-entry re-selection of
// the exam subject (same shape as modules/attendance's bulkMarkStudentAttendanceSchema).
export const bulkEnterMarksSchema = z.object({
  examSubjectId: z.string().uuid("Exam subject is required."),
  entries: z
    .array(
      z.object({
        studentId: z.string().uuid("Invalid student id."),
        marksObtained: z.number().nonnegative().optional(),
        isAbsent: z.boolean().default(false),
        remarks: z.string().trim().max(500).optional(),
      })
    )
    .min(1, "At least one student is required."),
});
export type BulkEnterMarksServiceInput = z.infer<typeof bulkEnterMarksSchema>;

export interface MarksEntryDTO {
  id: string;
  examSubjectId: string;
  studentId: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks: string | null;
}
