export interface ReportCardSubjectRow {
  subjectName: string;
  marksObtained: number | null;
  isAbsent: boolean;
  maxMarks: number;
  passingMarks: number;
}

export interface ReportCardAttendanceSummary {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  totalMarked: number;
}

export interface ReportCardDTO {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  className: string;
  sectionName: string;
  rollNumber: string | null;
  examName: string;
  subjects: ReportCardSubjectRow[];
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  overallGrade: string | null;
  rank: number | null;
  status: string;
  attendance: ReportCardAttendanceSummary | null;
}
