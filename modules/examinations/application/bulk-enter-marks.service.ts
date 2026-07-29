import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaMarksEntryRepository } from "../infrastructure/prisma-marks-entry.repository";
import { validateMarksEntryScope } from "./validate-marks-entry-scope.helpers";
import { InvalidMarksError } from "../domain/errors";
import { bulkEnterMarksSchema, type MarksEntryDTO } from "./dto/marks-entry.dto";

export interface BulkEnterMarksContext {
  tenantId: string;
  actingUserId: string;
}

// Bulk Marks Entry: one exam subject, many students, marked atomically — either the whole
// roster's marks are recorded or none of it is, matching bulk-mark-student-attendance.service.ts's
// own single-transaction precedent. Scope/authorization validated ONCE (shared with
// enter-marks.service.ts via validateMarksEntryScope), not once per student.
export async function bulkEnterMarks(
  input: unknown,
  context: BulkEnterMarksContext
): Promise<MarksEntryDTO[]> {
  const parsed = bulkEnterMarksSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid marks data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const { examSubject } = await validateMarksEntryScope(tenantId, actingUserId, data.examSubjectId);

  for (const entry of data.entries) {
    if (!entry.isAbsent) {
      if (entry.marksObtained === undefined) {
        throw new ValidationError("Marks obtained is required unless the student is marked absent.");
      }
      if (entry.marksObtained > examSubject.maxMarks) {
        throw new InvalidMarksError();
      }
    }
  }

  const repository = new PrismaMarksEntryRepository();

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

      const results: MarksEntryDTO[] = [];
      for (const entry of data.entries) {
        const marksEntry = await repository.markOne(
          {
            tenantId,
            examSubjectId: data.examSubjectId,
            studentId: entry.studentId,
            marksObtained: entry.isAbsent ? null : (entry.marksObtained ?? null),
            isAbsent: entry.isAbsent,
            remarks: entry.remarks ?? null,
            enteredBy: actingUserId,
          },
          tx
        );
        results.push({
          id: marksEntry.id,
          examSubjectId: marksEntry.examSubjectId,
          studentId: marksEntry.studentId,
          marksObtained: marksEntry.marksObtained,
          isAbsent: marksEntry.isAbsent,
          remarks: marksEntry.remarks,
        });
      }
      return results;
    });
  } catch (error) {
    // A student id that doesn't belong to this tenant fails the FK constraint on `create` (P2003)
    // inside the upsert — translated into the same StudentNotFoundError the single-entry path
    // throws for a missing student, matching bulk-mark-student-attendance.service.ts exactly.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new StudentNotFoundError();
    }
    throw error;
  }
}
