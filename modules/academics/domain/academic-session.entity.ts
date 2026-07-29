// Domain view of AcademicSession, decoupled from Prisma's generated type — same reasoning as
// modules/academics' Class/Section entities (docs/CODING_STANDARDS.md §6: repositories return
// domain entities, never raw Prisma models).
export type AcademicSessionStatusValue = "UPCOMING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export interface AcademicSessionEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  sessionName: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  status: AcademicSessionStatusValue;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
