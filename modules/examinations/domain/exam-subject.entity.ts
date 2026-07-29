export interface ExamSubjectEntity {
  id: string;
  tenantId: string;
  examId: string;
  classId: string;
  subjectId: string;
  maxMarks: number;
  passingMarks: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
