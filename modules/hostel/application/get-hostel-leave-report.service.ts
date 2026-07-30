import "server-only";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaHostelLeaveRequestRepository } from "../infrastructure/prisma-hostel-leave-request.repository";
import type { HostelLeaveReportRowDTO } from "./dto/reports.dto";
import type { HostelLeaveStatusValue } from "../domain/hostel-leave-request.entity";

const ALL_STATUSES: HostelLeaveStatusValue[] = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

// Leave Report (Phase 11 requirement 12) — every leave request, or filtered to one status.
export async function getHostelLeaveReport(
  tenantId: string,
  status?: HostelLeaveStatusValue
): Promise<HostelLeaveReportRowDTO[]> {
  const repository = new PrismaHostelLeaveRequestRepository();
  const statuses = status ? [status] : ALL_STATUSES;
  const requestGroups = await Promise.all(statuses.map((s) => repository.findByStatus(tenantId, s)));
  const requests = requestGroups.flat();

  const studentRepository = new PrismaStudentRepository();
  const rows: HostelLeaveReportRowDTO[] = [];
  for (const request of requests) {
    const student = await studentRepository.findById(tenantId, request.studentId);
    rows.push({
      id: request.id,
      studentId: request.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
      leaveType: request.leaveType,
      fromDate: request.fromDate.toISOString().slice(0, 10),
      toDate: request.toDate.toISOString().slice(0, 10),
      status: request.status,
      actualReturnDate: request.actualReturnDate ? request.actualReturnDate.toISOString().slice(0, 10) : null,
    });
  }

  rows.sort((a, b) => b.fromDate.localeCompare(a.fromDate));
  return rows;
}
