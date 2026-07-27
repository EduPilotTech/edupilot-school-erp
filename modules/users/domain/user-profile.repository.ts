import type { UserProfileEntity, UserProfileStatusValue } from "./user-profile.entity";

// Repository interface — methods only in terms of domain entities and primitive parameters,
// never a Prisma type, per docs/CODING_STANDARDS.md §6. Every method that operates on a
// specific tenant's data takes `tenantId` explicitly as its first parameter (never implicit,
// never trusted from a caller's request) — per docs/CODING_STANDARDS.md §6 and Part C/F of
// this sprint ("never trust tenantId from requests", "no cross-tenant operations").
//
// `findByAuthUserId` is the one exception with no `tenantId` parameter: it's a self-access
// lookup by primary key (= auth.users.id) that precedes knowing the tenant at all — the same
// reasoning already established for lib/auth/current-user.ts's getCurrentUser(). Used by the
// invitation-acceptance flow, which cannot know a tenant before resolving the invited profile.

export interface CreateUserProfileInput {
  id: string; // Supabase auth.users.id — assigned by the caller, never generated here
  tenantId: string;
  fullName: string;
  email?: string | null;
  createdBy?: string | null;
}

export interface UpdateUserProfileInput {
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  updatedBy?: string | null;
}

// Added in Sprint 3 — Step 4 for the Users List page — no query like this existed before
// (every prior repository method resolves a single, already-known user). `page`/`pageSize` are
// required, not optional, so every caller must supply already-defaulted values rather than the
// repository silently guessing at pagination bounds.
export interface UserProfileListFilter {
  search?: string;
  status?: UserProfileStatusValue;
  roleId?: string;
  page: number;
  pageSize: number;
}

export interface UserProfileListResult {
  items: UserProfileEntity[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserProfileRepository {
  findById(tenantId: string, id: string): Promise<UserProfileEntity | null>;
  findByAuthUserId(id: string): Promise<UserProfileEntity | null>;
  findByEmail(tenantId: string, email: string): Promise<UserProfileEntity | null>;
  findMany(tenantId: string, filter: UserProfileListFilter): Promise<UserProfileListResult>;
  create(input: CreateUserProfileInput): Promise<UserProfileEntity>;
  update(tenantId: string, id: string, input: UpdateUserProfileInput): Promise<UserProfileEntity>;
  updateStatus(
    tenantId: string,
    id: string,
    status: UserProfileStatusValue,
    updatedBy: string | null
  ): Promise<UserProfileEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<UserProfileEntity>;
  restore(tenantId: string, id: string, updatedBy: string | null): Promise<UserProfileEntity>;
}
