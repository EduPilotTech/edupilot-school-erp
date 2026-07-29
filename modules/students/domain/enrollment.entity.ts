export type EnrollmentStatusValue = "ACTIVE" | "COMPLETED" | "TRANSFERRED_OUT";

// Domain view of Enrollment. No `deletedAt` — by design, matching prisma/schema.prisma's
// Enrollment comment: even a data-entry correction is handled by closing the wrong row and
// creating a correct one, never deleting.
export interface EnrollmentEntity {
  id: string;
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  rollNumber: string | null;
  startDate: Date;
  endDate: Date | null;
  status: EnrollmentStatusValue;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
