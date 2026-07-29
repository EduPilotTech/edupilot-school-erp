import type { Prisma } from "@/lib/generated/prisma/client";
import type { GuardianEntity } from "./guardian.entity";

export interface CreateGuardianInput {
  tenantId: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  occupation?: string | null;
  createdBy?: string | null;
}

export interface UpdateGuardianInput {
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  occupation?: string | null;
  updatedBy?: string | null;
}

export interface GuardianListFilter {
  search?: string;
  page: number;
  pageSize: number;
}

export interface GuardianListResult {
  items: GuardianEntity[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GuardianRepository {
  findById(tenantId: string, id: string): Promise<GuardianEntity | null>;

  // Backs admission-time dedup: a guardian may already exist from an older sibling's admission.
  // Soft, best-effort matching — not a hard uniqueness constraint (see Sprint 4 — Step 1 Risks:
  // two different guardians could share a phone number in imperfect real-world data).
  findByPhoneOrEmail(
    tenantId: string,
    contact: { phone?: string; email?: string }
  ): Promise<GuardianEntity | null>;

  findMany(tenantId: string, filter: GuardianListFilter): Promise<GuardianListResult>;

  // `tx` (Sprint 4 — Step 4): optional. Omitted, this opens its own transaction exactly as
  // before — every existing caller is unaffected. Provided (by admit-student.service.ts, which
  // must create Student, Guardian, StudentGuardian, and Enrollment atomically), this call joins
  // that transaction instead of committing independently. See lib/prisma/tenant-context.ts.
  create(input: CreateGuardianInput, tx?: Prisma.TransactionClient): Promise<GuardianEntity>;

  // `tx` (Sprint 4 — Step 7): optional, same additive pattern as `create` above. Provided by
  // update-student-profile.service.ts, which must update the Student row and one or more
  // Guardian rows atomically.
  update(
    tenantId: string,
    id: string,
    input: UpdateGuardianInput,
    tx?: Prisma.TransactionClient
  ): Promise<GuardianEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<GuardianEntity>;
  restore(tenantId: string, id: string, updatedBy: string | null): Promise<GuardianEntity>;
}
