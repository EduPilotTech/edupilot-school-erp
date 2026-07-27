import "server-only";
import { prisma } from "@/lib/prisma";
import type { Role as PrismaRole } from "@/lib/generated/prisma/client";
import type { RoleRepository } from "../domain/role.repository";
import type { RoleEntity, RoleScopeValue } from "../domain/role.entity";

function toEntity(row: PrismaRole): RoleEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    scope: row.scope as RoleScopeValue,
    isProtected: row.isProtected,
    name: row.name,
    code: row.code,
    deletedAt: row.deletedAt,
  };
}

// Deliberately NOT wrapped in withTenantContext. Unlike every other tenant-scoped repository in
// this codebase, a Role lookup by id must be able to see System Roles (tenantId = null) and
// this tenant's own Custom Roles through the same call — the entire point of this method is to
// read the role's own tenantId and let the calling service (assign-role.service.ts) decide
// whether it's assignable, not to pre-filter by a tenant. This mirrors Role's own RLS policy
// shape from Sprint 2 — Step 1 (`tenant_id IS NULL OR tenant_id = current`), intentionally
// different from the strict-equality shape every other table uses.
export class PrismaRoleRepository implements RoleRepository {
  async findById(id: string): Promise<RoleEntity | null> {
    const row = await prisma.role.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findAvailableForTenant(tenantId: string): Promise<RoleEntity[]> {
    const rows = await prisma.role.findMany({
      where: { deletedAt: null, OR: [{ tenantId: null }, { tenantId }] },
      orderBy: { name: "asc" },
    });
    return rows.map(toEntity);
  }
}
