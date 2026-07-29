import "server-only";
import { ValidationError } from "@/lib/errors";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaMarksEntryRepository } from "../infrastructure/prisma-marks-entry.repository";
import { validateMarksEntryScope } from "./validate-marks-entry-scope.helpers";
import { InvalidMarksError } from "../domain/errors";
import { enterMarksSchema, type MarksEntryDTO } from "./dto/marks-entry.dto";

export interface EnterMarksContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: {
  id: string;
  examSubjectId: string;
  studentId: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks: string | null;
}): MarksEntryDTO {
  return {
    id: entity.id,
    examSubjectId: entity.examSubjectId,
    studentId: entity.studentId,
    marksObtained: entity.marksObtained,
    isAbsent: entity.isAbsent,
    remarks: entity.remarks,
  };
}

// Marks (or corrects) one student's mark for one exam subject. "One mark per student per exam
// subject" is a database guarantee (MarksEntryRepository.markOne upserts on the
// `@@unique([tenantId, examSubjectId, studentId])` constraint), not something this service needs
// to check separately — re-entering corrects it, matching mark-student-attendance.service.ts's
// own upsert precedent. Student existence is validated the same (light) way Attendance does —
// via StudentRepository.findById, not a full class-roster cross-check (see this service's own
// commit history / validate-marks-entry-scope.helpers.ts for why that's consistent, not lax).
export async function enterMarks(input: unknown, context: EnterMarksContext): Promise<MarksEntryDTO> {
  const parsed = enterMarksSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid marks data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const { examSubject } = await validateMarksEntryScope(tenantId, actingUserId, data.examSubjectId);

  if (!data.isAbsent) {
    if (data.marksObtained === undefined) {
      throw new ValidationError("Marks obtained is required unless the student is marked absent.");
    }
    if (data.marksObtained > examSubject.maxMarks) {
      throw new InvalidMarksError();
    }
  }

  const studentRepository = new PrismaStudentRepository();
  const student = await studentRepository.findById(tenantId, data.studentId);
  if (!student || student.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const repository = new PrismaMarksEntryRepository();
  const entry = await repository.markOne({
    tenantId,
    examSubjectId: data.examSubjectId,
    studentId: data.studentId,
    marksObtained: data.isAbsent ? null : (data.marksObtained ?? null),
    isAbsent: data.isAbsent,
    remarks: data.remarks ?? null,
    enteredBy: actingUserId,
  });

  return toDTO(entry);
}
