import type { Prisma } from "@/lib/generated/prisma/client";

export type GuardianRelationshipValue = "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER";

export interface StudentGuardianLink {
  id: string;
  tenantId: string;
  studentId: string;
  guardianId: string;
  relationship: GuardianRelationshipValue;
  isPrimary: boolean;
  createdAt: Date;
}

export interface StudentGuardianWithGuardianName extends StudentGuardianLink {
  guardianFullName: string;
  guardianPhone: string | null;
  guardianEmail: string | null;
}

export interface LinkStudentGuardianInput {
  tenantId: string;
  studentId: string;
  guardianId: string;
  relationship: GuardianRelationshipValue;
  isPrimary?: boolean;
  createdBy?: string | null;
}

// Pure many-to-many association repository — same shape as modules/users'
// UserRoleRepository: hard-deleted on unlink, no soft delete, since a link has no independent
// history worth preserving (see prisma/schema.prisma's StudentGuardian comment).
export interface StudentGuardianRepository {
  findByStudentAndGuardian(
    tenantId: string,
    studentId: string,
    guardianId: string
  ): Promise<StudentGuardianLink | null>;

  listForStudent(tenantId: string, studentId: string): Promise<StudentGuardianWithGuardianName[]>;
  listForGuardian(tenantId: string, guardianId: string): Promise<StudentGuardianLink[]>;

  // Backs a possible future "don't leave a student with zero guardians" rule — flagged, not
  // decided, in Sprint 4 — Step 1. Provided now since it's a cheap read any future service can
  // use without needing a repository change.
  countForStudent(tenantId: string, studentId: string, excludingId?: string): Promise<number>;

  // `tx` (Sprint 4 — Step 4): optional. Omitted, this opens its own transaction exactly as
  // before — every existing caller is unaffected. Provided (by admit-student.service.ts, which
  // must create Student, Guardian, StudentGuardian, and Enrollment atomically), this call joins
  // that transaction instead of committing independently. See lib/prisma/tenant-context.ts.
  link(input: LinkStudentGuardianInput, tx?: Prisma.TransactionClient): Promise<StudentGuardianLink>;
  unlink(tenantId: string, id: string): Promise<void>;
}
