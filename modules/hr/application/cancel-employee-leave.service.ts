import "server-only";
import { prisma } from "@/lib/prisma";
import { PrismaEmployeeLeaveBalanceRepository } from "../infrastructure/prisma-employee-leave-balance.repository";
import { PrismaEmployeeLeaveRequestRepository } from "../infrastructure/prisma-employee-leave-request.repository";
import { LeaveRequestNotFoundError, LeaveRequestNotCancellableError } from "../domain/errors";
import { toEmployeeLeaveRequestDTO } from "./apply-for-leave.service";
import type { EmployeeLeaveRequestDTO } from "./dto/leave.dto";
import type { HrContext } from "./hr-context";

// Cancellable if still PENDING, or APPROVED with a fromDate still in the future — an APPROVED
// request whose leave has already started/passed cannot be cancelled retroactively. Note:
// "only the requester or an HR manager may cancel" is an authorization rule, enforced at the
// Server Action/RBAC boundary (docs/SECURITY_GUIDELINES.md) — out of this application service's
// scope, which only enforces the business-state rule below (mirrors cancelHostelLeave's own
// precedent of not re-deriving caller identity inside the service).
export async function cancelLeaveRequest(leaveId: string, context: HrContext): Promise<EmployeeLeaveRequestDTO> {
  const { tenantId, actingUserId } = context;

  const requestRepository = new PrismaEmployeeLeaveRequestRepository();
  const existing = await requestRepository.findById(tenantId, leaveId);
  if (!existing) throw new LeaveRequestNotFoundError();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (existing.status === "PENDING") {
    const request = await requestRepository.cancel(tenantId, leaveId, actingUserId);
    return toEmployeeLeaveRequestDTO(request);
  }

  if (existing.status === "APPROVED") {
    if (existing.fromDate.getTime() <= today.getTime()) {
      throw new LeaveRequestNotCancellableError("This leave has already started or passed and can no longer be cancelled.");
    }

    const balanceRepository = new PrismaEmployeeLeaveBalanceRepository();
    const year = existing.fromDate.getUTCFullYear();

    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

      const request = await requestRepository.cancel(tenantId, leaveId, actingUserId, tx);
      // Reverse the usedDays increment that approval applied.
      await balanceRepository.adjustUsedDays(tenantId, existing.employeeId, existing.leaveTypeId, year, -existing.totalDays, actingUserId, tx);
      return toEmployeeLeaveRequestDTO(request);
    });
  }

  throw new LeaveRequestNotCancellableError();
}
