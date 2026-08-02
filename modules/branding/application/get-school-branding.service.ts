import "server-only";
import type { School } from "@/lib/generated/prisma/client";
import { SCHOOL_BRANDING_BUCKET } from "@/lib/storage/buckets";
import { SupabaseStorageService } from "@/lib/storage/supabase-storage.service";
import { PrismaSchoolBrandingRepository } from "../infrastructure/prisma-school-branding.repository";
import type { SchoolBrandingDTO } from "./dto/school-branding.dto";

export interface GetSchoolBrandingContext {
  tenantId: string;
  // Caller-supplied, not fetched here — same "context carries what the acting user can already
  // see, the service never reaches into lib/auth itself" rule get-student-id-card.service.ts's
  // own comment documents (see StudentIdCardSchoolInfo).
  school: School;
}

// Resolves a signed URL for a stored asset key, degrading to null (not throwing) if the file is
// missing/inaccessible — a broken branding asset must never break the page that's rendering it
// (a print document, the settings preview, etc.), matching StudentDocumentPreview's own
// fail-soft convention for signed URLs.
async function resolveAssetUrl(storage: SupabaseStorageService, key: string | null): Promise<string | null> {
  if (!key) return null;
  try {
    return await storage.signedUrl(SCHOOL_BRANDING_BUCKET, key);
  } catch {
    return null;
  }
}

// Single read service backing both the Branding settings page and every print document that
// needs branding (ID Card, Fee Receipt, Report Card) — one source of truth, per this bundle's "do
// not hardcode anything" requirement. Composes School (core identity, written once at signup) with
// SchoolBranding (presentation overlay, editable via this module) — see SchoolBranding's own
// schema comment for why they're separate tables.
export async function getSchoolBranding(context: GetSchoolBrandingContext): Promise<SchoolBrandingDTO> {
  const { tenantId, school } = context;

  const repository = new PrismaSchoolBrandingRepository();
  const branding = await repository.findByTenant(tenantId);

  const storage = new SupabaseStorageService();
  const [logoUrl, signatureUrl, sealUrl] = await Promise.all([
    resolveAssetUrl(storage, branding?.logoKey ?? null),
    resolveAssetUrl(storage, branding?.signatureKey ?? null),
    resolveAssetUrl(storage, branding?.sealKey ?? null),
  ]);

  return {
    schoolName: school.schoolName,
    shortName: school.shortName,
    registrationNumber: school.registrationNumber,
    board: school.board,
    principalName: school.principalName,
    email: school.email,
    phone: school.phone,
    website: school.website,
    address: school.address,
    city: school.city,
    district: school.district,
    state: school.state,
    country: school.country,
    postalCode: school.postalCode,

    // Falls back to School.logoUrl (Sprint 4.9's original, never-written-to column — see that
    // column's own schema comment) only if this module's own logo was never set, so an existing
    // deployment that somehow already had School.logoUrl populated doesn't regress.
    logoUrl: logoUrl ?? school.logoUrl ?? null,
    signatureUrl,
    sealUrl,
    headerText: branding?.headerText ?? null,
    footerText: branding?.footerText ?? null,
    themeColor: branding?.themeColor ?? null,
    motto: branding?.motto ?? null,
    socialMedia: {
      facebook: branding?.facebookUrl ?? null,
      twitter: branding?.twitterUrl ?? null,
      instagram: branding?.instagramUrl ?? null,
      linkedin: branding?.linkedinUrl ?? null,
      youtube: branding?.youtubeUrl ?? null,
    },
  };
}
