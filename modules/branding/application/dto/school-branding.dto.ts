import { z } from "zod";

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

// Empty-string-from-form -> null, matching every other optional-field pattern in this codebase
// (e.g. UpdateClassroomSchema's `capacity` handling) — a cleared text input submits `""`, which
// should mean "remove this value," not "set it to the literal empty string."
function optionalTextField(max: number) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).nullable().optional()
  );
}

function optionalUrlField() {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().url("Enter a valid URL.").nullable().optional()
  );
}

export const updateSchoolBrandingSchema = z.object({
  headerText: optionalTextField(300),
  footerText: optionalTextField(300),
  motto: optionalTextField(200),
  themeColor: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().regex(HEX_COLOR_REGEX, "Enter a valid hex color, e.g. #1D4ED8.").nullable().optional()
  ),
  facebookUrl: optionalUrlField(),
  twitterUrl: optionalUrlField(),
  instagramUrl: optionalUrlField(),
  linkedinUrl: optionalUrlField(),
  youtubeUrl: optionalUrlField(),
});
export type UpdateSchoolBrandingServiceInput = z.infer<typeof updateSchoolBrandingSchema>;

// One DTO used by both the Settings page (pre-fill the form + live preview) and every print
// document that consumes branding — a single `getSchoolBranding()` read service backs all of it,
// per this bundle's "must integrate with the existing Tenant and School models" requirement:
// the `school*`/`principalName`/contact fields below are read straight from School, never
// duplicated onto SchoolBranding.
export interface SchoolBrandingDTO {
  schoolName: string;
  shortName: string | null;
  registrationNumber: string;
  board: string;
  principalName: string;
  email: string;
  phone: string;
  website: string | null;
  address: string;
  city: string;
  district: string;
  state: string;
  country: string;
  postalCode: string;

  logoUrl: string | null;
  signatureUrl: string | null;
  sealUrl: string | null;
  headerText: string | null;
  footerText: string | null;
  themeColor: string | null;
  motto: string | null;
  socialMedia: {
    facebook: string | null;
    twitter: string | null;
    instagram: string | null;
    linkedin: string | null;
    youtube: string | null;
  };
}
