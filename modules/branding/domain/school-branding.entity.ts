// Product Completion Phase 17 Bundle A — the three uploadable image assets a school's branding
// can carry. A discriminated literal union (not a Prisma enum) since it only selects which
// storage-key column an upload/remove operation targets — it has no other meaning in the schema.
export type BrandingAssetType = "LOGO" | "SIGNATURE" | "SEAL";

export interface SchoolBrandingEntity {
  id: string;
  tenantId: string;
  logoKey: string | null;
  signatureKey: string | null;
  sealKey: string | null;
  headerText: string | null;
  footerText: string | null;
  themeColor: string | null;
  motto: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
