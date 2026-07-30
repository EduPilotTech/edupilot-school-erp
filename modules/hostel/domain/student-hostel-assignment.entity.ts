export type HostelAssignmentStatusValue = "ACTIVE" | "TRANSFERRED" | "CHECKED_OUT";
export type DietTypeValue = "VEG" | "NON_VEG" | "JAIN" | "VEGAN" | "OTHER";

// Append-only, close-not-edit — deliberately mirrors EnrollmentEntity (not
// StudentTransportAssignment's upsert shape), since this phase explicitly asks for Transfer and
// History. "Current" is the row with `checkOutDate === null`.
export interface StudentHostelAssignmentEntity {
  id: string;
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  roomId: string;
  bedId: string;
  dietPreference: DietTypeValue | null;
  checkInDate: Date;
  checkOutDate: Date | null;
  status: HostelAssignmentStatusValue;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
