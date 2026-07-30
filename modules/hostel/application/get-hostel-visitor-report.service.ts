import "server-only";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaHostelVisitorRepository } from "../infrastructure/prisma-hostel-visitor.repository";
import type { HostelVisitorReportRowDTO } from "./dto/reports.dto";

// Visitor Report (Phase 11 requirement 12).
export async function getHostelVisitorReport(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<HostelVisitorReportRowDTO[]> {
  const repository = new PrismaHostelVisitorRepository();
  const visitors = await repository.findByDateRange(tenantId, startDate, endDate);

  const studentRepository = new PrismaStudentRepository();
  const rows: HostelVisitorReportRowDTO[] = [];
  for (const visitor of visitors) {
    const student = await studentRepository.findById(tenantId, visitor.studentId);
    rows.push({
      id: visitor.id,
      studentId: visitor.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
      visitorName: visitor.visitorName,
      relation: visitor.relation,
      purpose: visitor.purpose,
      entryTime: visitor.entryTime.toISOString(),
      exitTime: visitor.exitTime ? visitor.exitTime.toISOString() : null,
    });
  }

  return rows;
}
