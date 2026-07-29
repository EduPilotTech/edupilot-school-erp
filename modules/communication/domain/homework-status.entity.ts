export type HomeworkStatusValue = "PENDING" | "SUBMITTED" | "COMPLETED";

// Teacher-set, parent-read-only (Decision 3) — no student upload workflow this phase.
export interface HomeworkStatusEntity {
  id: string;
  tenantId: string;
  homeworkId: string;
  studentId: string;
  status: HomeworkStatusValue;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
}
