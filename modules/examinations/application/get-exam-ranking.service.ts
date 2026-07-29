import "server-only";
import { listStudents } from "@/modules/students/application/list-students.service";
import { PrismaExamResultRepository } from "../infrastructure/prisma-exam-result.repository";
import type { RankingRowDTO } from "./dto/ranking.dto";

// Pure read — the ranked list for one (exam, class, section), already ranked at generation time
// (Phase 7 Decision 3: shared ranks for ties), enriched with student display info the same way
// modules/attendance's report services enrich their rosters.
export async function getExamRanking(
  examId: string,
  classId: string,
  sectionId: string,
  context: { tenantId: string }
): Promise<RankingRowDTO[]> {
  const resultRepository = new PrismaExamResultRepository();
  const results = await resultRepository.findByExamClassSection(context.tenantId, examId, classId, sectionId);

  const roster = await listStudents({ classId, sectionId, page: 1, pageSize: 500 }, { tenantId: context.tenantId });
  const studentById = new Map(roster.items.map((student) => [student.id, student]));

  return results
    .map((result) => {
      const student = studentById.get(result.studentId);
      return {
        studentId: result.studentId,
        admissionNumber: student?.admissionNumber ?? "Unknown",
        fullName: student ? `${student.firstName} ${student.lastName}` : "Unknown Student",
        totalMarksObtained: result.totalMarksObtained,
        totalMaxMarks: result.totalMaxMarks,
        percentage: result.percentage,
        overallGrade: result.overallGrade,
        rank: result.rank,
        status: result.status,
      };
    })
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
}
