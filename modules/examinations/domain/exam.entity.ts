export type ExamStatusValue =
  | "DRAFT"
  | "SCHEDULED"
  | "ONGOING"
  | "MARKS_ENTRY_COMPLETED"
  | "RESULT_GENERATED"
  | "RESULT_PUBLISHED";

export interface ExamEntity {
  id: string;
  tenantId: string;
  academicSessionId: string;
  examTypeId: string;
  gradeScaleId: string | null;
  name: string;
  startDate: Date;
  endDate: Date;
  status: ExamStatusValue;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
