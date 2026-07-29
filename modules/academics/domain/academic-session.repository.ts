import type { AcademicSessionEntity } from "./academic-session.entity";

// Read-only surface (Sprint 4 — Step 4, Step 1: "Academic Read Services"). No `create`/`update`/
// `softDelete` here — AcademicSession is not written to by this sprint's scope, and adding
// unused write methods would be scope creep beyond what Student Admission needs.
export interface AcademicSessionRepository {
  findById(tenantId: string, id: string): Promise<AcademicSessionEntity | null>;

  // "Active" = not soft-deleted and not yet COMPLETED/ARCHIVED — a session a student can
  // actually be admitted into. Unlike Class/Section's `findMany`, this returns the full list
  // (no pagination): admission's Academic Session dropdown needs every active session, not a page.
  findActive(tenantId: string): Promise<AcademicSessionEntity[]>;
}
