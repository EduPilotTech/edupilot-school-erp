export interface ExamResultDTO {
  id: string;
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
  status: string;
}
