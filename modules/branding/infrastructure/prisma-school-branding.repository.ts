import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { SchoolBranding as PrismaSchoolBranding } from "@/lib/generated/prisma/client";
import type {
  SchoolBrandingRepository,
  UpsertSchoolBrandingInput,
} from "../domain/school-branding.repository";
import type { SchoolBrandingEntity } from "../domain/school-branding.entity";

function toEntity(row: PrismaSchoolBranding): SchoolBrandingEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logoKey: row.logoKey,
    signatureKey: row.signatureKey,
    sealKey: row.sealKey,
    headerText: row.headerText,
    footerText: row.footerText,
    themeColor: row.themeColor,
    motto: row.motto,
    facebookUrl: row.facebookUrl,
    twitterUrl: row.twitterUrl,
    instagramUrl: row.instagramUrl,
    linkedinUrl: row.linkedinUrl,
    youtubeUrl: row.youtubeUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

// Every settable field is `undefined` (leave the existing value alone) vs `null` (explicitly
// clear it) vs a real value (set it) — this helper keeps only the keys the caller actually
// provided, so `upsertOne({tenantId, themeColor: "#1D4ED8"})` never overwrites logoKey/footerText/
// etc. with `undefined` (Prisma would otherwise interpret a present `undefined` key as "no
// change" already, but building the object this way keeps the `create`/`update` payloads
// identical and easy to reason about — no reliance on Prisma's undefined-vs-absent nuance).
function definedFields<T extends object>(input: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(input) as (keyof T)[]) {
    if (input[key] !== undefined) {
      result[key] = input[key];
    }
  }
  return result;
}

export class PrismaSchoolBrandingRepository implements SchoolBrandingRepository {
  async findByTenant(tenantId: string): Promise<SchoolBrandingEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.schoolBranding.findUnique({ where: { tenantId } })
    );
    return row ? toEntity(row) : null;
  }

  async upsertOne(input: UpsertSchoolBrandingInput): Promise<SchoolBrandingEntity> {
    const { tenantId, updatedBy, ...rest } = input;
    const fields = definedFields(rest);

    const row = await withTenantContext(tenantId, (tx) =>
      tx.schoolBranding.upsert({
        where: { tenantId },
        create: { tenantId, createdBy: updatedBy ?? null, ...fields },
        update: { updatedBy: updatedBy ?? null, ...fields },
      })
    );
    return toEntity(row);
  }
}
