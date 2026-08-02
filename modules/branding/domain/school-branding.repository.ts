import type { SchoolBrandingEntity } from "./school-branding.entity";

// A single upsert shape covers every write this module needs (text-field edits, a single
// asset-key swap, or both together) — every field but `tenantId`/`updatedBy` is optional, and the
// repository only writes the keys actually present on `input` (see PrismaSchoolBrandingRepository's
// own comment on why `undefined` vs `null` matters here). This mirrors
// PeriodConfigurationRepository.upsertOne's "upsert, not create+update" convention (modules/
// timetable/domain/period-configuration.repository.ts) — the closest existing "one row per key"
// singleton repository in this codebase — adapted to a bare `tenantId` unique key instead of a
// compound one.
export interface UpsertSchoolBrandingInput {
  tenantId: string;
  logoKey?: string | null;
  signatureKey?: string | null;
  sealKey?: string | null;
  headerText?: string | null;
  footerText?: string | null;
  themeColor?: string | null;
  motto?: string | null;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
  updatedBy?: string | null;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6 — no ambient tenant
// context, never trusted from a caller's request.
export interface SchoolBrandingRepository {
  // Returns null when the tenant has never configured branding yet — a valid, expected state
  // (every application-layer read service must treat this as "use defaults," not an error).
  findByTenant(tenantId: string): Promise<SchoolBrandingEntity | null>;

  upsertOne(input: UpsertSchoolBrandingInput): Promise<SchoolBrandingEntity>;
}
