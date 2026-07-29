import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  GenderValue,
  StudentEntity,
  StudentListItemEntity,
  StudentProfileEntity,
  StudentStatusValue,
} from "./student.entity";

export interface CreateStudentInput {
  tenantId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender?: GenderValue | null;
  photoUrl?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  admissionDate: Date;
  createdBy?: string | null;
}

export interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: GenderValue | null;
  photoUrl?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  updatedBy?: string | null;
}

export type StudentSortField = "admissionNumber" | "name" | "admissionDate";
export type SortDirection = "asc" | "desc";

// `search` matches Admission Number, Student Name (first/last), Guardian Name, and Guardian
// Mobile — one combined search box, matching the existing Users List UX convention (a single
// `search` field the repository fans out into an OR across several columns), not four separate
// inputs. `academicSessionId`/`classId`/`sectionId` filter by the student's *current* Enrollment
// only (endDate IS NULL) — a past enrollment doesn't make a student "in" that class today.
export interface StudentListFilter {
  search?: string;
  status?: StudentStatusValue;
  academicSessionId?: string;
  classId?: string;
  sectionId?: string;
  sortBy?: StudentSortField;
  sortDirection?: SortDirection;
  page: number;
  pageSize: number;
}

export interface StudentListResult {
  items: StudentListItemEntity[];
  total: number;
  page: number;
  pageSize: number;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6.
export interface StudentRepository {
  findById(tenantId: string, id: string): Promise<StudentEntity | null>;

  // Backs the "no duplicate admission numbers" check in the future admission service — same
  // category of proactive dedup check as UserProfileRepository.findByEmail (Sprint 3).
  findByAdmissionNumber(tenantId: string, admissionNumber: string): Promise<StudentEntity | null>;

  findMany(tenantId: string, filter: StudentListFilter): Promise<StudentListResult>;

  // Sprint 4 — Step 6: the Student Profile page's single source of data — every guardian and
  // every enrollment for this student, in one query (see PrismaStudentRepository's
  // `studentProfileSelect`). Deliberately does NOT filter `deletedAt` (repositories contain no
  // business rules, per docs/CODING_STANDARDS.md §6) — the caller decides what a soft-deleted
  // row means.
  findProfileById(tenantId: string, id: string): Promise<StudentProfileEntity | null>;

  // `tx` (Sprint 4 — Step 4): optional. Omitted, this opens its own transaction exactly as
  // before — every existing caller is unaffected. Provided (by admit-student.service.ts, which
  // must create Student, Guardian, StudentGuardian, and Enrollment atomically), this call joins
  // that transaction instead of committing independently. See lib/prisma/tenant-context.ts.
  create(input: CreateStudentInput, tx?: Prisma.TransactionClient): Promise<StudentEntity>;

  // `tx` (Sprint 4 — Step 7): optional, same additive pattern as `create` above. Provided by
  // update-student-profile.service.ts, which must update the Student row and one or more
  // Guardian rows atomically.
  update(
    tenantId: string,
    id: string,
    input: UpdateStudentInput,
    tx?: Prisma.TransactionClient
  ): Promise<StudentEntity>;
  updateStatus(
    tenantId: string,
    id: string,
    status: StudentStatusValue,
    updatedBy: string | null
  ): Promise<StudentEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<StudentEntity>;
  restore(tenantId: string, id: string, updatedBy: string | null): Promise<StudentEntity>;
}
