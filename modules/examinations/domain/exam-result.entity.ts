export type ExamResultStatusValue = "PASS" | "FAIL";

// Generated, immutable snapshot — see prisma/schema.prisma's ExamResult comment for the full
// reasoning (no per-subject breakdown here; Report Card reads MarksEntry directly for that).
export interface ExamResultEntity {
  id: string;
  tenantId: string;
  examId: string;
  studentId: string;
  classId: string;
  sectionId: string;
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  overallGrade: string | null;
  gradePoint: number | null;
  rank: number | null;
  status: ExamResultStatusValue;
  generatedAt: Date;
  generatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
