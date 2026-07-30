import "server-only";
import { PrismaHostelLeaveRequestRepository } from "../infrastructure/prisma-hostel-leave-request.repository";
import { toHostelLeaveRequestDTO } from "./request-hostel-leave.service";
import type { HostelLeaveRequestDTO } from "./dto/hostel-leave-request.dto";
import type { HostelLeaveStatusValue } from "../domain/hostel-leave-request.entity";

export async function listHostelLeaveRequestsByStudent(
  tenantId: string,
  studentId: string
): Promise<HostelLeaveRequestDTO[]> {
  const repository = new PrismaHostelLeaveRequestRepository();
  const requests = await repository.findByStudent(tenantId, studentId);
  return requests.map(toHostelLeaveRequestDTO);
}

export async function listHostelLeaveRequestsByStatus(
  tenantId: string,
  status: HostelLeaveStatusValue
): Promise<HostelLeaveRequestDTO[]> {
  const repository = new PrismaHostelLeaveRequestRepository();
  const requests = await repository.findByStatus(tenantId, status);
  return requests.map(toHostelLeaveRequestDTO);
}
