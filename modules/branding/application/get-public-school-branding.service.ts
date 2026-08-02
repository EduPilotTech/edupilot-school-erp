import "server-only";
import { prisma } from "@/lib/prisma";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import { PrismaSchoolBrandingRepository } from "../infrastructure/prisma-school-branding.repository";
import { signPublicBrandingLogoUrl } from "../infrastructure/public-branding-storage.adapter";

export interface PublicSchoolBrandingDTO {
  schoolName: string;
  logoUrl: string | null;
  themeColor: string | null;
}

// Completion Pass — Login page branding (checklist #1). The one branding read in this codebase
// that runs before authentication: `/login` is a single, tenant-agnostic page (no subdomain
// routing — see this pass's own research), so a school's slug is the only pre-auth input
// available. Deliberately returns only non-sensitive, already-public-facing identity (never
// contact info, never anything from SchoolBranding's header/footer/social fields) — and returns
// null (not a thrown error) for an unknown, inactive, or soft-deleted tenant, so this can't be
// used to enumerate which school codes exist via error-shape/timing differences.
export async function getPublicSchoolBranding(slug: string): Promise<PublicSchoolBrandingDTO | null> {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) return null;

  const tenant = await prisma.tenant.findUnique({ where: { slug: trimmed } });
  if (!tenant || tenant.deletedAt || tenant.status !== "ACTIVE") return null;

  const school = await withTenantContext(tenant.id, (tx) =>
    tx.school.findUnique({ where: { tenantId: tenant.id } })
  );
  if (!school) return null;

  const brandingRepository = new PrismaSchoolBrandingRepository();
  const branding = await brandingRepository.findByTenant(tenant.id);

  let logoUrl: string | null = null;
  if (branding?.logoKey) {
    logoUrl = await signPublicBrandingLogoUrl(branding.logoKey);
  }
  if (!logoUrl) {
    logoUrl = school.logoUrl ?? null;
  }

  return {
    schoolName: school.schoolName,
    logoUrl,
    themeColor: branding?.themeColor ?? null,
  };
}
