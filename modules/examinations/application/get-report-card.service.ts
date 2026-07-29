import "server-only";
import { listStudents } from "@/modules/students/application/list-students.service";
import { getStudentAttendanceReport } from "@/modules/attendance/application/get-student-attendance-report.service";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaExamRepository } from "../infrastructure/prisma-exam.repository";
import { PrismaExamSubjectRepository } from "../infrastructure/prisma-exam-subject.repository";
import { PrismaMarksEntryRepository } from "../infrastructure/prisma-marks-entry.repository";
import { PrismaExamResultRepository } from "../infrastructure/prisma-exam-result.repository";
import { PrismaSubjectRepository } from "@/modules/academics/infrastructure/prisma-subject.repository";
import { ExamNotFoundError, ExamResultNotFoundError } from "../domain/errors";
import type { ReportCardDTO } from "./dto/report-card.dto";

// Pure read, composing an already-generated ExamResult with its per-subject MarksEntry
// breakdown (read directly, not duplicated onto ExamResult — see ExamResult's own schema
// comment) and — Phase 7 Decision 5 — the EXISTING Attendance report service, not new
// attendance logic. Attendance is summarized across the exam's own AcademicSession, matching how
// a report card conventionally shows "days present this year," not just during the exam window.
export async function getReportCard(
  examId: string,
  studentId: string,
  context: { tenantId: string }
): Promise<ReportCardDTO> {
  const { tenantId } = context;

  const examRepository = new PrismaExamRepository();
  const exam = await examRepository.findById(tenantId, examId);
  if (!exam || exam.deletedAt !== null) {
    throw new ExamNotFoundError();
  }

  const resultRepository = new PrismaExamResultRepository();
  const result = await resultRepository.findByExamAndStudent(tenantId, examId, studentId);
  if (!result) {
    throw new ExamResultNotFoundError();
  }

  const [examSubjects, marksEntries, roster, session, subjects] = await Promise.all([
    new PrismaExamSubjectRepository().findByExamAndClass(tenantId, examId, result.classId),
    new PrismaMarksEntryRepository().findByStudentAndExam(tenantId, studentId, examId),
    listStudents({ classId: result.classId, sectionId: result.sectionId, page: 1, pageSize: 500 }, { tenantId }),
    new PrismaAcademicSessionRepository().findById(tenantId, exam.academicSessionId),
    new PrismaSubjectRepository().findMany(tenantId, { page: 1, pageSize: 200 }),
  ]);

  const student = roster.items.find((item) => item.id === studentId);
  const subjectNameById = new Map(subjects.items.map((subject) => [subject.id, subject.name]));
  const marksByExamSubjectId = new Map(marksEntries.map((entry) => [entry.examSubjectId, entry]));

  const subjectRows = examSubjects.map((examSubject) => {
    const marksEntry = marksByExamSubjectId.get(examSubject.id);
    return {
      subjectName: subjectNameById.get(examSubject.subjectId) ?? "Unknown Subject",
      marksObtained: marksEntry?.marksObtained ?? null,
      isAbsent: marksEntry?.isAbsent ?? false,
      maxMarks: examSubject.maxMarks,
      passingMarks: examSubject.passingMarks,
    };
  });

  const attendance = session
    ? await getStudentAttendanceReport(
        { studentId, startDate: session.startDate, endDate: session.endDate },
        { tenantId }
      ).then((report) => ({
        present: report.counts.PRESENT,
        absent: report.counts.ABSENT,
        late: report.counts.LATE,
        halfDay: report.counts.HALF_DAY,
        leave: report.counts.LEAVE,
        totalMarked: report.counts.total,
      }))
    : null;

  return {
    studentId,
    admissionNumber: student?.admissionNumber ?? "Unknown",
    fullName: student ? `${student.firstName} ${student.lastName}` : "Unknown Student",
    className: student?.currentClassName ?? "",
    sectionName: student?.currentSectionName ?? "",
    rollNumber: student?.currentRollNumber ?? null,
    examName: exam.name,
    subjects: subjectRows,
    totalMarksObtained: result.totalMarksObtained,
    totalMaxMarks: result.totalMaxMarks,
    percentage: result.percentage,
    overallGrade: result.overallGrade,
    rank: result.rank,
    status: result.status,
    attendance,
  };
}
