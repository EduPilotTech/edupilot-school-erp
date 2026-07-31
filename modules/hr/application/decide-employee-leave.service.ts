import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { PrismaEmployeeLeaveBalanceRepository } from "../infrastructure/prisma-employee-leave-balance.repository";
import { PrismaEmployeeLeaveRequestRepository } from "../infrastructure/prisma-employee-leave-request.repository";
import { LeaveRequestNotFoundError, LeaveRequestNotPendingError } from "../domain/errors";
import { rejectEmployeeLeaveSchema, type EmployeeLeaveRequestDTO } from "./dto/leave.dto";
import { toEmployeeLeaveRequestDTO } from "./apply-for-leave.service";
import { notifyEmployee } from "./hr-notification.helpers";
import type { HrContext } from "./hr-context";

// Approve/reject share the "must be PENDING" guard and the "load the employee for notification"
// step — factored here to avoid duplicating both across the two exports below.
async function loadPendingRequestAndEmployee(tenantId: string, leaveId: string) {
  const requestRepository = new PrismaEmployeeLeaveRequestRepository();
  const existing = await requestRepository.findById(tenantId, leaveId);
  if (!existing) throw new LeaveRequestNotFoundError();
  if (existing.status !== "PENDING") throw new LeaveRequestNotPendingError();

  const employee = await new PrismaEmployeeRepository().findById(tenantId, existing.employeeId);
  if (!employee) throw new LeaveRequestNotFoundError();

  return { existing, employee, requestRepository };
}

// Approval increments EmployeeLeaveBalance.usedDays and updates the request's status atomically
// (one Postgres transaction) — a partial "approved but balance not updated" state must never be
// observable, per the phase brief's explicit requirement.
export async function approveLeaveRequest(leaveId: string, context: HrContext): Promise<EmployeeLeaveRequestDTO> {
  const { tenantId, actingUserId } = context;
  const { existing, employee } = await loadPendingRequestAndEmployee(tenantId, leaveId);

  const requestRepository = new PrismaEmployeeLeaveRequestRepository();
  const balanceRepository = new PrismaEmployeeLeaveBalanceRepository();
  const year = existing.fromDate.getUTCFullYear();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const request = await requestRepository.decide(
      tenantId,
      leaveId,
      { status: "APPROVED", approvedBy: actingUserId, approvedAt: new Date(), updatedBy: actingUserId },
      tx
    );
    await balanceRepository.adjustUsedDays(tenantId, existing.employeeId, existing.leaveTypeId, year, existing.totalDays, actingUserId, tx);
    await notifyEmployee(
      tenantId,
      employee.userProfileId,
      { title: "Leave Approved", body: "Your leave request has been approved.", referenceType: "EmployeeLeaveRequest", referenceId: leaveId },
      tx
    );
    return toEmployeeLeaveRequestDTO(request);
  });
}

export async function rejectLeaveRequest(leaveId: string, input: unknown, context: HrContext): Promise<EmployeeLeaveRequestDTO> {
  const parsed = rejectEmployeeLeaveSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "A rejection reason is required.");
  }
  const { tenantId, actingUserId } = context;
  const { employee } = await loadPendingRequestAndEmployee(tenantId, leaveId);

  const requestRepository = new PrismaEmployeeLeaveRequestRepository();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const request = await requestRepository.decide(
      tenantId,
      leaveId,
      {
        status: "REJECTED",
        approvedBy: actingUserId,
        approvedAt: new Date(),
        rejectionReason: parsed.data.rejectionReason,
        updatedBy: actingUserId,
      },
      tx
    );
    await notifyEmployee(
      tenantId,
      employee.userProfileId,
      { title: "Leave Rejected", body: "Your leave request has been rejected.", referenceType: "EmployeeLeaveRequest", referenceId: leaveId },
      tx
    );
    return toEmployeeLeaveRequestDTO(request);
  });
}
