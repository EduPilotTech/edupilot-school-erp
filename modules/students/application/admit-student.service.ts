import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaClassRepository } from "@/modules/academics/infrastructure/prisma-class.repository";
import { PrismaSectionRepository } from "@/modules/academics/infrastructure/prisma-section.repository";
import { PrismaStudentRepository } from "../infrastructure/prisma-student.repository";
import { PrismaGuardianRepository } from "../infrastructure/prisma-guardian.repository";
import { PrismaStudentGuardianRepository } from "../infrastructure/prisma-student-guardian.repository";
import { PrismaEnrollmentRepository } from "../infrastructure/prisma-enrollment.repository";
import {
  GuardianRequiredError,
  InvalidAcademicSessionError,
  InvalidClassError,
  InvalidSectionError,
  StudentAlreadyExistsError,
} from "../domain/errors";
import { admitStudentSchema, type AdmitStudentInput, type AdmitStudentResult } from "./dto/admit-student.dto";
import type { GuardianRelationshipValue } from "../domain/student-guardian.repository";

export interface AdmitStudentContext {
  tenantId: string;
  actingUserId: string;
}

interface ResolvedGuardianInput {
  relationship: GuardianRelationshipValue;
  fullName: string;
  phone?: string;
  occupation?: string;
}

// Sprint 4 — Step 4, Step 2/6: the core admission service. Validates the Academic Session/
// Class/Section hierarchy and guardian requirement (Step 5), then creates Student, Guardian(s),
// StudentGuardian link(s), and Enrollment inside a single Prisma transaction (Step 6) — passing
// that transaction's client through to each repository's `create`/`link` call via the optional
// `tx` parameter (see lib/prisma/tenant-context.ts) so the whole operation commits or rolls
// back atomically.
//
// Deliberately does NOT attempt guardian dedup/reuse (GuardianRepository.findByPhoneOrEmail
// exists for a future "same guardian across siblings" enhancement, but Step 5's business-rule
// list does not ask for it this step) — every admission creates a brand-new Guardian row.
export async function admitStudent(
  rawInput: AdmitStudentInput,
  context: AdmitStudentContext
): Promise<AdmitStudentResult> {
  // Defense-in-depth re-validation (docs/CODING_STANDARDS.md §4): the Server Action already
  // validated the raw form; this service must still be safe to call from tests or future
  // callers that skip that layer. Uses safeParse + a thrown ValidationError, matching the
  // established modules/users convention (see invite-user.service.ts) rather than a bare
  // `schema.parse()` that would surface a raw ZodError to the caller.
  const parsed = admitStudentSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid admission data.");
  }
  const input = parsed.data;

  const { tenantId, actingUserId } = context;

  const academicSessionRepository = new PrismaAcademicSessionRepository();
  const classRepository = new PrismaClassRepository();
  const sectionRepository = new PrismaSectionRepository();
  const studentRepository = new PrismaStudentRepository();
  const guardianRepository = new PrismaGuardianRepository();
  const studentGuardianRepository = new PrismaStudentGuardianRepository();
  const enrollmentRepository = new PrismaEnrollmentRepository();

  // Academic Session/Class/Section required, and each must belong to the one before it —
  // reads happen before the write transaction opens, since none of them need to be atomic with
  // the writes that follow (Step 5).
  const session = await academicSessionRepository.findById(
    tenantId,
    input.academic.academicSessionId
  );
  if (
    !session ||
    session.deletedAt !== null ||
    (session.status !== "UPCOMING" && session.status !== "ACTIVE")
  ) {
    throw new InvalidAcademicSessionError();
  }

  const classEntity = await classRepository.findById(tenantId, input.academic.classId);
  if (
    !classEntity ||
    classEntity.deletedAt !== null ||
    classEntity.academicSessionId !== session.id
  ) {
    throw new InvalidClassError();
  }

  const section = await sectionRepository.findById(tenantId, input.academic.sectionId);
  if (!section || section.deletedAt !== null || section.classId !== classEntity.id) {
    throw new InvalidSectionError();
  }

  // Required Guardian validation: at least one of father/mother/local guardian must have a
  // name. First populated guardian in father > mother > local guardian order is marked primary.
  const guardianInputs: ResolvedGuardianInput[] = [];
  if (input.guardians.father.fullName) {
    guardianInputs.push({
      relationship: "FATHER",
      fullName: input.guardians.father.fullName,
      phone: input.guardians.father.phone,
      occupation: input.guardians.father.occupation,
    });
  }
  if (input.guardians.mother.fullName) {
    guardianInputs.push({
      relationship: "MOTHER",
      fullName: input.guardians.mother.fullName,
      phone: input.guardians.mother.phone,
      occupation: input.guardians.mother.occupation,
    });
  }
  if (input.guardians.localGuardian.fullName) {
    guardianInputs.push({
      relationship: "GUARDIAN",
      fullName: input.guardians.localGuardian.fullName,
      phone: input.guardians.localGuardian.phone,
      occupation: input.guardians.localGuardian.occupation,
    });
  }

  if (guardianInputs.length === 0) {
    throw new GuardianRequiredError();
  }

  const admissionYear = input.academic.admissionDate.getFullYear();

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

      const admissionNumber = await generateAdmissionNumber(tx, tenantId, admissionYear);

      const student = await studentRepository.create(
        {
          tenantId,
          admissionNumber,
          firstName: input.student.firstName,
          lastName: input.student.lastName,
          dateOfBirth: input.student.dateOfBirth,
          gender: input.student.gender ?? null,
          address: input.address.address ?? null,
          city: input.address.city ?? null,
          state: input.address.state ?? null,
          country: input.address.country ?? null,
          postalCode: input.address.postalCode ?? null,
          admissionDate: input.academic.admissionDate,
          createdBy: actingUserId,
        },
        tx
      );

      for (const [index, guardianInput] of guardianInputs.entries()) {
        const guardian = await guardianRepository.create(
          {
            tenantId,
            fullName: guardianInput.fullName,
            phone: guardianInput.phone ?? null,
            email: null,
            occupation: guardianInput.occupation ?? null,
            createdBy: actingUserId,
          },
          tx
        );

        await studentGuardianRepository.link(
          {
            tenantId,
            studentId: student.id,
            guardianId: guardian.id,
            relationship: guardianInput.relationship,
            isPrimary: index === 0,
            createdBy: actingUserId,
          },
          tx
        );
      }

      const enrollment = await enrollmentRepository.create(
        {
          tenantId,
          studentId: student.id,
          academicSessionId: session.id,
          classId: classEntity.id,
          sectionId: section.id,
          rollNumber: input.academic.rollNumber ?? null,
          startDate: input.academic.admissionDate,
          createdBy: actingUserId,
        },
        tx
      );

      return {
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        enrollmentId: enrollment.id,
      };
    });
  } catch (error) {
    // `@@unique([tenantId, admissionNumber])` is the ultimate backstop against a rare
    // concurrent-admission race on the generated admission number (Step 5) — no automatic
    // retry this step, per Sprint 4 — Step 4's documented, accepted limitation.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new StudentAlreadyExistsError();
    }
    throw error;
  }
}

// `ADM{YYYY}{5-digit sequential}` — sequential is derived by counting this tenant's existing
// students admitted in the same year, computed inside the transaction (Step 5).
async function generateAdmissionNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
  admissionYear: number
): Promise<string> {
  const prefix = `ADM${admissionYear}`;
  const count = await tx.student.count({
    where: { tenantId, admissionNumber: { startsWith: prefix } },
  });
  const sequential = String(count + 1).padStart(5, "0");
  return `${prefix}${sequential}`;
}
