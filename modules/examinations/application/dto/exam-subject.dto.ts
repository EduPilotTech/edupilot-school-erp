import { z } from "zod";

export const addExamSubjectSchema = z.object({
  examId: z.string().uuid("Exam is required."),
  classId: z.string().uuid("Class is required."),
  subjectId: z.string().uuid("Subject is required."),
  maxMarks: z.number().positive("Max marks must be greater than zero."),
  passingMarks: z.number().nonnegative("Passing marks cannot be negative."),
});
export type AddExamSubjectServiceInput = z.infer<typeof addExamSubjectSchema>;

export interface ExamSubjectDTO {
  id: string;
  examId: string;
  classId: string;
  subjectId: string;
  maxMarks: number;
  passingMarks: number;
  isActive: boolean;
}
