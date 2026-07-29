import type { SelectOption } from "./admission-form.types";

// Matches the Gender/GuardianRelationship enum values already defined in prisma/schema.prisma
// (modules/students) — kept as a local literal list here rather than importing the Prisma
// enum directly, since this Client Component form must not import anything from
// lib/generated/prisma (a server-only dependency chain) or modules/students/infrastructure.
export const GENDER_OPTIONS: SelectOption[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

export const BLOOD_GROUP_OPTIONS: SelectOption[] = [
  { value: "A_POSITIVE", label: "A+" },
  { value: "A_NEGATIVE", label: "A-" },
  { value: "B_POSITIVE", label: "B+" },
  { value: "B_NEGATIVE", label: "B-" },
  { value: "AB_POSITIVE", label: "AB+" },
  { value: "AB_NEGATIVE", label: "AB-" },
  { value: "O_POSITIVE", label: "O+" },
  { value: "O_NEGATIVE", label: "O-" },
];

export const LOCAL_GUARDIAN_RELATION_OPTIONS: SelectOption[] = [
  { value: "GUARDIAN", label: "Guardian" },
  { value: "GRANDPARENT", label: "Grandparent" },
  { value: "SIBLING", label: "Sibling" },
  { value: "UNCLE_AUNT", label: "Uncle/Aunt" },
  { value: "OTHER", label: "Other" },
];
