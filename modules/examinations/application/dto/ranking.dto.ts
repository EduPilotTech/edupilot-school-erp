export interface RankingRowDTO {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  overallGrade: string | null;
  rank: number | null;
  status: string;
}
