import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { UserRole as PrismaUserRole } from "@/lib/generated/prisma/client";
import type {
  CreateUserRoleInput,
  UserRoleAssignment,
  UserRoleAssignmentWithRole,
  UserRoleRepository,
} from "../domain/user-role.repository";

function toEntity(row: PrismaUserRole): UserRoleAssignment {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    roleId: row.roleId,
    isPrimary: row.isPrimary,
    createdAt: row.createdAt,
  };
}

// UserRole's only compound unique is (userId, roleId) — there is no (tenantId, id) compound key
// the way UserProfile/School have, since nothing else needed one. Lookups/writes below use
// `findFirst`/`deleteMany` with `tenantId` as an explicit filter (rather than a bare
// `where: { id }`) for the same reason every other repository in this codebase scopes by
// tenantId at the query level: it enforces "no cross-tenant operations" independent of RLS,
// which doesn't exist yet.
export class PrismaUserRoleRepository implements UserRoleRepository {
  async findByUserAndRole(
    tenantId: string,
    userId: string,
    roleId: string
  ): Promise<UserRoleAssignment | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.userRole.findFirst({ where: { tenantId, userId, roleId } })
    );
    return row ? toEntity(row) : null;
  }

  async listForUser(tenantId: string, userId: string): Promise<UserRoleAssignmentWithRole[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.userRole.findMany({
        where: { tenantId, userId },
        include: { role: true },
        orderBy: { createdAt: "asc" },
      })
    );

    return rows.map((row) => ({
      ...toEntity(row),
      roleName: row.role.name,
      roleCode: row.role.code,
      roleIsProtected: row.role.isProtected,
    }));
  }

  async countActiveProtectedRoleHolders(tenantId: string, excludingId?: string): Promise<number> {
    return withTenantContext(tenantId, async (tx) => {
      const rows = await tx.userRole.findMany({
        where: {
          tenantId,
          id: excludingId ? { not: excludingId } : undefined,
          role: { isProtected: true, deletedAt: null },
          user: { status: "ACTIVE", deletedAt: null },
        },
        select: { userId: true },
        distinct: ["userId"],
      });
      return rows.length;
    });
  }

  async countUserProtectedRoles(
    tenantId: string,
    userId: string,
    excludingId?: string
  ): Promise<number> {
    return withTenantContext(tenantId, (tx) =>
      tx.userRole.count({
        where: {
          tenantId,
          userId,
          id: excludingId ? { not: excludingId } : undefined,
          role: { isProtected: true, deletedAt: null },
        },
      })
    );
  }

  async create(input: CreateUserRoleInput): Promise<UserRoleAssignment> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.userRole.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          roleId: input.roleId,
          createdBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await withTenantContext(tenantId, (tx) => tx.userRole.deleteMany({ where: { id, tenantId } }));
  }
}
