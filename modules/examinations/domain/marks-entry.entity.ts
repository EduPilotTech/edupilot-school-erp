export interface MarksEntryEntity {
  id: string;
  tenantId: string;
  examSubjectId: string;
  studentId: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks: string | null;
  enteredBy: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
