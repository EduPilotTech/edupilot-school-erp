import "server-only";
import { getCurrentEnrollmentForStudent } from "@/modules/students/application/list-current-enrollments.service";
import { PrismaExamRepository } from "../infrastructure/prisma-exam.repository";
import { PrismaExamSubjectRepository } from "../infrastructure/prisma-exam-subject.repository";
import { PrismaMarksEntryRepository } from "../infrastructure/prisma-marks-entry.repository";
import { PrismaExamResultRepository } from "../infrastructure/prisma-exam-result.repository";
import { resolveGradeBandsForExam } from "./resolve-exam-grade-bands.helpers";
import { computeExamResultTotals, type MarksBreakdownInput } from "./compute-exam-result.helpers";
import { resolveGrade } from "./grade-band-validation.helpers";
import {
  ExamNotFoundError,
  IncompleteMarksEntryError,
  InvalidExamStatusError,
  StudentNotEnrolledError,
} from "../domain/errors";
import { requiresStatus } from "./exam-lifecycle.helpers";
import type { ExamResultDTO } from "./dto/exam-result.dto";
import type { Prisma } from "@/lib/generated/prisma/client";

export interface GenerateResultContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: {
  id: string;
  examId: string;
  studentId: string;
  classId: string;
  sectionId: string;
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  overallGrade: string | null;
  gradePoint: number | null;
  rank: number | null;
  status: string;
}): ExamResultDTO {
  return {
    id: entity.id,
    examId: entity.examId,
    studentId: entity.studentId,
    classId: entity.classId,
    sectionId: entity.sectionId,
    totalMarksObtained: entity.totalMarksObtained,
    totalMaxMarks: entity.totalMaxMarks,
    percentage: entity.percentage,
    overallGrade: entity.overallGrade,
    gradePoint: entity.gradePoint,
    rank: entity.rank,
    status: entity.status,
  };
}

// Generates (or regenerates) one student's ExamResult — only while the Exam is
// MARKS_ENTRY_COMPLETED (Phase 7 Decision 8: results are generated as their own lifecycle step,
// not implicitly). Requires a MarksEntry for every ExamSubject of the student's current class —
// a partial result would silently understate the total, so this refuses rather than guessing.
// `rank` is intentionally left untouched here — see ExamResultRepository.upsertOne's own
// comment: ranking is a separate, whole-section pass (ranking.service.ts) that runs after every
// student in the section has been generated.
export async function generateResult(
  examId: string,
  studentId: string,
  context: GenerateResultContext,
  tx?: Prisma.TransactionClient
): Promise<ExamResultDTO> {
  const { tenantId, actingUserId } = context;

  const examRepository = new PrismaExamRepository();
  const exam = await examRepository.findById(tenantId, examId);
  if (!exam || exam.deletedAt !== null) {
    throw new ExamNotFoundError();
  }
  const statusError = requiresStatus(exam.status, "MARKS_ENTRY_COMPLETED");
  if (statusError) {
    throw new InvalidExamStatusError(statusError);
  }

  const enrollment = await getCurrentEnrollmentForStudent(studentId, exam.academicSessionId, { tenantId });
  if (!enrollment) {
    throw new StudentNotEnrolledError();
  }

  const examSubjectRepository = new PrismaExamSubjectRepository();
  const examSubjects = await examSubjectRepository.findByExamAndClass(tenantId, examId, enrollment.classId);
  if (examSubjects.length === 0) {
    throw new IncompleteMarksEntryError("No subjects are configured for this exam and class.");
  }

  const marksEntryRepository = new PrismaMarksEntryRepository();
  const marksEntries = await marksEntryRepository.findByStudentAndExam(tenantId, studentId, examId);
  const marksByExamSubjectId = new Map(marksEntries.map((entry) => [entry.examSubjectId, entry]));

  const breakdown: MarksBreakdownInput[] = [];
  for (const examSubject of examSubjects) {
    const marksEntry = marksByExamSubjectId.get(examSubject.id);
    if (!marksEntry) {
      throw new IncompleteMarksEntryError();
    }
    breakdown.push({
      marksObtained: marksEntry.marksObtained,
      isAbsent: marksEntry.isAbsent,
      maxMarks: examSubject.maxMarks,
      passingMarks: examSubject.passingMarks,
    });
  }

  const totals = computeExamResultTotals(breakdown);
  const bands = await resolveGradeBandsForExam(tenantId, exam);
  const gradeBand = bands.length > 0 ? resolveGrade(totals.percentage, bands) : null;

  const resultRepository = new PrismaExamResultRepository();
  const result = await resultRepository.upsertOne(
    {
      tenantId,
      examId,
      studentId,
      classId: enrollment.classId,
      sectionId: enrollment.sectionId,
      totalMarksObtained: totals.totalMarksObtained,
      totalMaxMarks: totals.totalMaxMarks,
      percentage: totals.percentage,
      overallGrade: gradeBand?.grade ?? null,
      gradePoint: gradeBand?.gradePoint ?? null,
      status: totals.status,
      generatedBy: actingUserId,
    },
    tx
  );

  return toDTO(result);
}
