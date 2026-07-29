export type StudentTransportTripTypeValue = "PICKUP_ONLY" | "DROP_ONLY" | "PICKUP_AND_DROP";

// Decision 8 — a temporary opt-out (holiday, short leave) is a distinct fact from a permanent one.
export type StudentTransportAssignmentStatusValue = "ACTIVE" | "TEMPORARY_STOP" | "DISCONTINUED";

// The transport analogue of StudentFeeAssignment — one row per student per session.
export interface StudentTransportAssignmentEntity {
  id: string;
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  routeId: string;
  stopId: string;
  tripType: StudentTransportTripTypeValue;
  status: StudentTransportAssignmentStatusValue;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
