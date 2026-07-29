import "server-only";
import { PrismaMarksEntryRepository } from "../infrastructure/prisma-marks-entry.repository";
import type { MarksEntryDTO } from "./dto/marks-entry.dto";

export async function listMarksForExamSubject(
  examSubjectId: string,
  context: { tenantId: string }
): Promise<MarksEntryDTO[]> {
  const repository = new PrismaMarksEntryRepository();
  const entries = await repository.findByExamSubject(context.tenantId, examSubjectId);
  return entries.map((entry) => ({
    id: entry.id,
    examSubjectId: entry.examSubjectId,
    studentId: entry.studentId,
    marksObtained: entry.marksObtained,
    isAbsent: entry.isAbsent,
    remarks: entry.remarks,
  }));
}
