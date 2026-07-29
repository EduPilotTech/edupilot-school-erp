import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Guardian as PrismaGuardian, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateGuardianInput,
  GuardianListFilter,
  GuardianListResult,
  GuardianRepository,
  UpdateGuardianInput,
} from "../domain/guardian.repository";
import type { GuardianEntity } from "../domain/guardian.entity";

function toEntity(row: PrismaGuardian): GuardianEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    fullName: row.fullName,
    phone: row.phone,
    email: row.email,
    occupation: row.occupation,
    userProfileId: row.userProfileId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaGuardianRepository implements GuardianRepository {
  async findById(tenantId: string, id: string): Promise<GuardianEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.guardian.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByPhoneOrEmail(
    tenantId: string,
    contact: { phone?: string; email?: string }
  ): Promise<GuardianEntity | null> {
    if (!contact.phone && !contact.email) {
      return null;
    }

    const row = await withTenantContext(tenantId, (tx) =>
      tx.guardian.findFirst({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            ...(contact.phone ? [{ phone: contact.phone }] : []),
            ...(contact.email ? [{ email: contact.email }] : []),
          ],
        },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByUserProfileId(tenantId: string, userProfileId: string): Promise<GuardianEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.guardian.findUnique({ where: { tenantId_userProfileId: { tenantId, userProfileId } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter: GuardianListFilter): Promise<GuardianListResult> {
    return withTenantContext(tenantId, async (tx) => {
      const where = {
        tenantId,
        ...(filter.search
          ? {
              OR: [
                { fullName: { contains: filter.search, mode: "insensitive" as const } },
                { phone: { contains: filter.search, mode: "insensitive" as const } },
                { email: { contains: filter.search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      };

      const [rows, total] = await Promise.all([
        tx.guardian.findMany({
          where,
          orderBy: { fullName: "asc" },
          skip: (filter.page - 1) * filter.pageSize,
          take: filter.pageSize,
        }),
        tx.guardian.count({ where }),
      ]);

      return { items: rows.map(toEntity), total, page: filter.page, pageSize: filter.pageSize };
    });
  }

  async create(input: CreateGuardianInput, tx?: Prisma.TransactionClient): Promise<GuardianEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (t) =>
        t.guardian.create({
          data: {
            tenantId: input.tenantId,
            fullName: input.fullName,
            phone: input.phone ?? null,
            email: input.email ?? null,
            occupation: input.occupation ?? null,
            createdBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateGuardianInput,
    tx?: Prisma.TransactionClient
  ): Promise<GuardianEntity> {
    const row = await withTenantContext(
      tenantId,
      (t) =>
        t.guardian.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            fullName: input.fullName,
            phone: input.phone,
            email: input.email,
            occupation: input.occupation,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<GuardianEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.guardian.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }

  async restore(tenantId: string, id: string, updatedBy: string | null): Promise<GuardianEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.guardian.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: null, updatedBy },
      })
    );
    return toEntity(row);
  }

  async linkToUserProfile(
    tenantId: string,
    id: string,
    userProfileId: string,
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<GuardianEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.guardian.update({
          where: { tenantId_id: { tenantId, id } },
          data: { userProfileId, updatedBy },
        }),
      tx
    );
    return toEntity(row);
  }
}
