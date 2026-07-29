import "server-only";
import { getStudentProfile } from "@/modules/students/application/get-student-profile.service";
import { PrismaExamResultRepository } from "../infrastructure/prisma-exam-result.repository";
import { PrismaExamRepository } from "../infrastructure/prisma-exam.repository";
import type { StudentProgressReportDTO } from "./dto/progress-report.dto";

// Pure read — a student's ExamResult across EVERY exam they have one for, in chronological
// (generation) order. Same underlying ExamResult data as Report Card, different shape: one
// student across many exams, not one exam across many subjects — same "one dataset, several
// report shapes" relationship as modules/timetable's Teacher/Class/Classroom timetables.
export async function getStudentProgressReport(
  studentId: string,
  context: { tenantId: string }
): Promise<StudentProgressReportDTO> {
  const { tenantId } = context;

  const [profile, results] = await Promise.all([
    getStudentProfile({ studentId }, { tenantId }),
    new PrismaExamResultRepository().findByStudent(tenantId, studentId),
  ]);

  const examRepository = new PrismaExamRepository();
  const exams = await Promise.all(results.map((result) => examRepository.findById(tenantId, result.examId)));
  const examNameById = new Map(exams.filter((exam) => exam !== null).map((exam) => [exam.id, exam.name]));

  return {
    studentId,
    admissionNumber: profile.student.admissionNumber,
    fullName: profile.student.fullName,
    entries: results.map((result) => ({
      examId: result.examId,
      examName: examNameById.get(result.examId) ?? "Unknown Exam",
      percentage: result.percentage,
      overallGrade: result.overallGrade,
      rank: result.rank,
      status: result.status,
    })),
  };
}
