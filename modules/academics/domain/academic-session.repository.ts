import type { AcademicSessionEntity } from "./academic-session.entity";

export interface CreateAcademicSessionInput {
  tenantId: string;
  schoolId: string;
  sessionName: string;
  startDate: Date;
  endDate: Date;
  createdBy?: string | null;
}

// Extended beyond the original read-only surface (Sprint 4 — Step 4, Step 1) once the Academic
// Setup flow confirmed a genuine, previously-unmet need: nothing in this codebase could create an
// AcademicSession row, so the Class/Section dropdowns on Student Admission had no data to ever
// populate for a freshly registered school. `create` is additive — `findById`/`findActive` are
// untouched from their original shape.
export interface AcademicSessionRepository {
  findById(tenantId: string, id: string): Promise<AcademicSessionEntity | null>;

  // "Active" = not soft-deleted and not yet COMPLETED/ARCHIVED — a session a student can
  // actually be admitted into. Unlike Class/Section's `findMany`, this returns the full list
  // (no pagination): admission's Academic Session dropdown needs every active session, not a page.
  findActive(tenantId: string): Promise<AcademicSessionEntity[]>;

  create(input: CreateAcademicSessionInput): Promise<AcademicSessionEntity>;
}
