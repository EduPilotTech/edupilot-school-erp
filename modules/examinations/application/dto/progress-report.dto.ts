export interface ProgressReportEntry {
  examId: string;
  examName: string;
  percentage: number;
  overallGrade: string | null;
  rank: number | null;
  status: string;
}

export interface StudentProgressReportDTO {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  entries: ProgressReportEntry[];
}
