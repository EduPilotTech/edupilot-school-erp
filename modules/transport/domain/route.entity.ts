// School-scoped, session-independent master data (Decision 5) — reused year to year like
// Classroom, not reset every academic session.
export interface RouteEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
