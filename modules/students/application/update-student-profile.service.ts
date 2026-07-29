import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import {
  updateStudentProfileSchema,
  type UpdateStudentProfileInput,
  type UpdateStudentProfileResult,
} from "./dto/update-student-profile.dto";
import { PrismaStudentRepository } from "../infrastructure/prisma-student.repository";
import { PrismaGuardianRepository } from "../infrastructure/prisma-guardian.repository";
import { PrismaStudentGuardianRepository } from "../infrastructure/prisma-student-guardian.repository";
import { GuardianRequiredError, StudentNotFoundError } from "../domain/errors";
import type { UpdateStudentInput } from "../domain/student.repository";
import type { UpdateGuardianInput } from "../domain/guardian.repository";
import type { GuardianRelationshipValue } from "../domain/student-guardian.repository";
import type { StudentProfileGuardianEntity } from "../domain/student.entity";

export interface UpdateStudentProfileContext {
  tenantId: string;
  actingUserId: string;
}

const GUARDIAN_SLOTS = [
  { key: "father" as const, relationship: "FATHER" as GuardianRelationshipValue, label: "Father" },
  { key: "mother" as const, relationship: "MOTHER" as GuardianRelationshipValue, label: "Mother" },
  {
    key: "localGuardian" as const,
    relationship: "GUARDIAN" as GuardianRelationshipValue,
    label: "Local Guardian",
  },
];

function normalize(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

// Sprint 4 — Step 7. Updates Student information, Address, and Guardian information (three
// fixed slots: Father/Mother/Local Guardian, matching admission's own structure) inside one
// transaction. Deliberately does NOT touch Academic fields (Class/Section/Session/Roll Number)
// — see update-student-profile.dto.ts's comment: EnrollmentRepository has no `update` method by
// design, and the user confirmed academic placement stays out of scope for this step.
//
// "Optimize updates to avoid unnecessary writes" (Step 9): every field is dirty-checked against
// the freshly-fetched profile first. If nothing actually changed, no transaction is opened at
// all — not even an empty one.
export async function updateStudentProfile(
  input: unknown,
  context: UpdateStudentProfileContext
): Promise<UpdateStudentProfileResult> {
  const parsed = updateStudentProfileSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid student edit data.");
  }
  const data: UpdateStudentProfileInput = parsed.data;

  const { tenantId, actingUserId } = context;

  const studentRepository = new PrismaStudentRepository();
  const guardianRepository = new PrismaGuardianRepository();
  const studentGuardianRepository = new PrismaStudentGuardianRepository();

  const profile = await studentRepository.findProfileById(tenantId, data.studentId);
  if (!profile || profile.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  // --- Student + Address diff (dirty-check against the fetched profile) ------------------
  const studentDiff: Partial<UpdateStudentInput> = {};
  if (data.student.firstName !== profile.firstName) studentDiff.firstName = data.student.firstName;
  if (data.student.lastName !== profile.lastName) studentDiff.lastName = data.student.lastName;
  if (data.student.dateOfBirth.getTime() !== profile.dateOfBirth.getTime()) {
    studentDiff.dateOfBirth = data.student.dateOfBirth;
  }
  if ((data.student.gender ?? null) !== profile.gender) {
    studentDiff.gender = data.student.gender ?? null;
  }
  if (normalize(data.address.address) !== (profile.address ?? undefined)) {
    studentDiff.address = normalize(data.address.address) ?? null;
  }
  if (normalize(data.address.city) !== (profile.city ?? undefined)) {
    studentDiff.city = normalize(data.address.city) ?? null;
  }
  if (normalize(data.address.state) !== (profile.state ?? undefined)) {
    studentDiff.state = normalize(data.address.state) ?? null;
  }
  if (normalize(data.address.country) !== (profile.country ?? undefined)) {
    studentDiff.country = normalize(data.address.country) ?? null;
  }
  if (normalize(data.address.postalCode) !== (profile.postalCode ?? undefined)) {
    studentDiff.postalCode = normalize(data.address.postalCode) ?? null;
  }

  // --- Guardian slot resolution ------------------------------------------------------------
  type GuardianAction =
    | { kind: "none" }
    | { kind: "update"; guardianId: string; diff: Partial<UpdateGuardianInput> }
    | { kind: "create"; relationship: GuardianRelationshipValue; fullName: string; phone?: string; occupation?: string };

  const guardianActions: GuardianAction[] = GUARDIAN_SLOTS.map((slot) => {
    const existing: StudentProfileGuardianEntity | undefined = profile.guardians.find(
      (guardian) => guardian.relationship === slot.relationship
    );
    const submitted = data.guardians[slot.key];
    const fullName = normalize(submitted.fullName);
    const phone = normalize(submitted.phone);
    const occupation = normalize(submitted.occupation);

    if (existing) {
      // This edit form does not support removing a guardian — clearing a previously-set name
      // is rejected rather than silently treated as "no change" or as an implicit removal.
      if (!fullName) {
        throw new GuardianRequiredError(`${slot.label}'s name cannot be cleared once set.`);
      }

      const diff: Partial<UpdateGuardianInput> = {};
      if (fullName !== existing.fullName) diff.fullName = fullName;
      if ((phone ?? null) !== existing.phone) diff.phone = phone ?? null;
      if ((occupation ?? null) !== existing.occupation) diff.occupation = occupation ?? null;

      return Object.keys(diff).length > 0
        ? { kind: "update", guardianId: existing.id, diff }
        : { kind: "none" };
    }

    if (!fullName) {
      return { kind: "none" };
    }

    return { kind: "create", relationship: slot.relationship, fullName, phone, occupation };
  });

  const finalGuardianCount = GUARDIAN_SLOTS.filter((slot, index) => {
    const existing = profile.guardians.some((guardian) => guardian.relationship === slot.relationship);
    const action = guardianActions[index];
    return existing || action.kind === "create";
  }).length;

  if (finalGuardianCount === 0) {
    throw new GuardianRequiredError();
  }

  const hasStudentChanges = Object.keys(studentDiff).length > 0;
  const hasGuardianChanges = guardianActions.some((action) => action.kind !== "none");

  // Nothing actually changed — return without opening a transaction at all.
  if (!hasStudentChanges && !hasGuardianChanges) {
    return { studentId: data.studentId };
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    if (hasStudentChanges) {
      await studentRepository.update(
        tenantId,
        data.studentId,
        { ...studentDiff, updatedBy: actingUserId },
        tx
      );
    }

    // Only the FIRST guardian created in this edit (when the student started with zero) becomes
    // primary — tracked with a mutable flag rather than re-deriving from the original profile
    // snapshot each iteration, which would incorrectly mark every newly-created guardian in the
    // same edit as primary if more than one slot was empty before.
    let primaryAssigned = profile.guardians.length > 0;

    for (const action of guardianActions) {
      if (action.kind === "update") {
        await guardianRepository.update(
          tenantId,
          action.guardianId,
          { ...action.diff, updatedBy: actingUserId },
          tx
        );
      } else if (action.kind === "create") {
        const guardian = await guardianRepository.create(
          {
            tenantId,
            fullName: action.fullName,
            phone: action.phone ?? null,
            email: null,
            occupation: action.occupation ?? null,
            createdBy: actingUserId,
          },
          tx
        );

        const isPrimary = !primaryAssigned;
        primaryAssigned = true;

        await studentGuardianRepository.link(
          {
            tenantId,
            studentId: data.studentId,
            guardianId: guardian.id,
            relationship: action.relationship,
            isPrimary,
            createdBy: actingUserId,
          },
          tx
        );
      }
    }

    return { studentId: data.studentId };
  });
}
