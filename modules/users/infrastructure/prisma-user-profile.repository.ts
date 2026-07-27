import "server-only";
import { prisma } from "@/lib/prisma";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { UserProfile as PrismaUserProfile } from "@/lib/generated/prisma/client";
import type {
  CreateUserProfileInput,
  UpdateUserProfileInput,
  UserProfileListFilter,
  UserProfileListResult,
  UserProfileRepository,
} from "../domain/user-profile.repository";
import type { UserProfileEntity, UserProfileStatusValue } from "../domain/user-profile.entity";

function toEntity(row: PrismaUserProfile): UserProfileEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatarUrl,
    status: row.status as UserProfileStatusValue,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

// Every tenant-scoped lookup/write below uses the `tenantId_id` compound unique (from
// `@@unique([tenantId, id])` on UserProfile, added in Sprint 1B for the UserRole composite FK)
// rather than a bare `where: { id }`. This matters, not just style: querying by `id` alone
// would succeed regardless of whether that row's real tenantId matches the `tenantId` this
// method was called with — it would rely entirely on RLS (which doesn't exist yet) to catch a
// mismatch. Scoping the `where` clause itself enforces "no cross-tenant operations" at the
// Prisma/SQL level, independent of RLS ever being implemented.
export class PrismaUserProfileRepository implements UserProfileRepository {
  async findById(tenantId: string, id: string): Promise<UserProfileEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.userProfile.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  // Self-access by primary key (= auth.users.id) — precedes knowing the tenant, same reasoning
  // as lib/auth/current-user.ts's getCurrentUser(). Not wrapped in withTenantContext.
  async findByAuthUserId(id: string): Promise<UserProfileEntity | null> {
    const row = await prisma.userProfile.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByEmail(tenantId: string, email: string): Promise<UserProfileEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.userProfile.findFirst({ where: { tenantId, email } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(
    tenantId: string,
    filter: UserProfileListFilter
  ): Promise<UserProfileListResult> {
    return withTenantContext(tenantId, async (tx) => {
      const where = {
        tenantId,
        ...(filter.search
          ? {
              OR: [
                { fullName: { contains: filter.search, mode: "insensitive" as const } },
                { email: { contains: filter.search, mode: "insensitive" as const } },
              ],
            }
          : {}),
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.roleId ? { userRoles: { some: { roleId: filter.roleId } } } : {}),
      };

      const [rows, total] = await Promise.all([
        tx.userProfile.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (filter.page - 1) * filter.pageSize,
          take: filter.pageSize,
        }),
        tx.userProfile.count({ where }),
      ]);

      return {
        items: rows.map(toEntity),
        total,
        page: filter.page,
        pageSize: filter.pageSize,
      };
    });
  }

  async create(input: CreateUserProfileInput): Promise<UserProfileEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.userProfile.create({
        data: {
          id: input.id,
          tenantId: input.tenantId,
          fullName: input.fullName,
          email: input.email ?? null,
          createdBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateUserProfileInput
  ): Promise<UserProfileEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.userProfile.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          fullName: input.fullName,
          phone: input.phone,
          avatarUrl: input.avatarUrl,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: UserProfileStatusValue,
    updatedBy: string | null
  ): Promise<UserProfileEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.userProfile.update({
        where: { tenantId_id: { tenantId, id } },
        data: { status, updatedBy },
      })
    );
    return toEntity(row);
  }

  async softDelete(
    tenantId: string,
    id: string,
    deletedBy: string | null
  ): Promise<UserProfileEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.userProfile.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }

  // Clears deletedAt only — `status` is left exactly as it was frozen at deletion time, not
  // reset to a default, per the Sprint 3 — Step 1 lifecycle design.
  async restore(
    tenantId: string,
    id: string,
    updatedBy: string | null
  ): Promise<UserProfileEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.userProfile.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: null, updatedBy },
      })
    );
    return toEntity(row);
  }
}
