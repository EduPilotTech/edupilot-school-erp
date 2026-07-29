import "server-only";
import { PrismaExamRepository } from "../infrastructure/prisma-exam.repository";
import { PrismaExamSubjectRepository } from "../infrastructure/prisma-exam-subject.repository";
import { ExamNotFoundError, ExamSubjectNotFoundError, InvalidExamStatusError } from "../domain/errors";
import { requiresStatus } from "./exam-lifecycle.helpers";
import { assertMarksEntryAuthorized } from "./marks-authorization.helpers";
import type { ExamEntity } from "../domain/exam.entity";
import type { ExamSubjectEntity } from "../domain/exam-subject.entity";

export interface MarksEntryScope {
  exam: ExamEntity;
  examSubject: ExamSubjectEntity;
}

// Shared by enter-marks.service.ts and bulk-enter-marks.service.ts — resolves the ExamSubject and
// its parent Exam, checks the exam is ONGOING (the only status marks entry is allowed in), and
// enforces Phase 7 Decision 4's per-teacher authorization. Mirrors modules/attendance's
// validateAttendanceScope helper.
export async function validateMarksEntryScope(
  tenantId: string,
  actingUserId: string,
  examSubjectId: string
): Promise<MarksEntryScope> {
  const examSubjectRepository = new PrismaExamSubjectRepository();
  const examSubject = await examSubjectRepository.findById(tenantId, examSubjectId);
  if (!examSubject || examSubject.deletedAt !== null) {
    throw new ExamSubjectNotFoundError();
  }

  const examRepository = new PrismaExamRepository();
  const exam = await examRepository.findById(tenantId, examSubject.examId);
  if (!exam || exam.deletedAt !== null) {
    throw new ExamNotFoundError();
  }

  const statusError = requiresStatus(exam.status, "ONGOING");
  if (statusError) {
    throw new InvalidExamStatusError(statusError);
  }

  await assertMarksEntryAuthorized(tenantId, actingUserId, examSubject, exam.academicSessionId);

  return { exam, examSubject };
}
