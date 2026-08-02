import "server-only";
import { prisma } from "@/lib/prisma";

// Platform Admin UI's School Management list (suspend/activate) — a pure, zero-computation read
// across every tenant, so it goes through the plain `prisma` client directly rather than a
// tenant-scoped repository interface, mirroring billing-run.service.ts's own
// `processBillingRun`/`prisma.tenant.findMany(...)` precedent (also cited by
// billing-dashboard.service.ts's own header comment) for the same reason: Tenant has no
// tenant_id column of its own to scope by in the first place. Unlike every other file in this
// module, this one contains no rules, no validation, and no computation — just a list, mapped
// straight across from the Tenant row.
export interface SchoolManagementRowDTO {
  tenantId: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  subscriptionPlan: string;
  subscriptionStatus: string;
}

export async function listSchoolsForManagement(): Promise<SchoolManagementRowDTO[]> {
  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  return tenants.map((tenant) => ({
    tenantId: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    subscriptionPlan: tenant.subscriptionPlan,
    subscriptionStatus: tenant.subscriptionStatus,
  }));
}
