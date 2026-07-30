import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import type { Prisma } from "@/lib/generated/prisma/client";
import { PrismaStudentGuardianRepository } from "@/modules/students/infrastructure/prisma-student-guardian.repository";
import { PrismaGuardianRepository } from "@/modules/students/infrastructure/prisma-guardian.repository";
import { dispatchNotification } from "@/modules/communication/application/dispatch-notification.helpers";
import { PrismaHostelLeaveRequestRepository } from "../infrastructure/prisma-hostel-leave-request.repository";
import { HostelLeaveRequestNotFoundError, LeaveRequestNotPendingError } from "../domain/errors";
import { rejectHostelLeaveSchema, type HostelLeaveRequestDTO } from "./dto/hostel-leave-request.dto";
import { toHostelLeaveRequestDTO } from "./request-hostel-leave.service";
import type { HostelContext } from "./create-hostel.service";

async function notifyGuardiansOfLeaveDecision(
  tenantId: string,
  studentId: string,
  approved: boolean,
  tx: Prisma.TransactionClient
): Promise<void> {
  const studentGuardianRepository = new PrismaStudentGuardianRepository();
  const guardianRepository = new PrismaGuardianRepository();
  const links = await studentGuardianRepository.listForStudent(tenantId, studentId);

  const title = approved ? "Hostel leave approved" : "Hostel leave rejected";
  const body = approved
    ? "Your child's hostel leave request has been approved."
    : "Your child's hostel leave request has been rejected.";

  for (const link of links) {
    const guardian = await guardianRepository.findById(tenantId, link.guardianId);
    if (!guardian?.userProfileId) continue;
    await dispatchNotification(
      {
        tenantId,
        recipientUserProfileId: guardian.userProfileId,
        type: "NOTICE",
        priority: "HIGH",
        title,
        body,
        referenceType: "HostelLeaveRequest",
        referenceId: studentId,
      },
      tx
    );
  }
}

export async function approveHostelLeave(leaveId: string, context: HostelContext): Promise<HostelLeaveRequestDTO> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaHostelLeaveRequestRepository();
  const existing = await repository.findById(tenantId, leaveId);
  if (!existing) {
    throw new HostelLeaveRequestNotFoundError();
  }
  if (existing.status !== "PENDING") {
    throw new LeaveRequestNotPendingError();
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const leave = await repository.decide(tenantId, leaveId, {
      status: "APPROVED",
      approvedBy: actingUserId,
      approvedAt: new Date(),
      updatedBy: actingUserId,
    });
    await notifyGuardiansOfLeaveDecision(tenantId, existing.studentId, true, tx);
    return toHostelLeaveRequestDTO(leave);
  });
}

export async function rejectHostelLeave(
  leaveId: string,
  input: unknown,
  context: HostelContext
): Promise<HostelLeaveRequestDTO> {
  const parsed = rejectHostelLeaveSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "A rejection reason is required.");
  }
  const { tenantId, actingUserId } = context;
  const repository = new PrismaHostelLeaveRequestRepository();
  const existing = await repository.findById(tenantId, leaveId);
  if (!existing) {
    throw new HostelLeaveRequestNotFoundError();
  }
  if (existing.status !== "PENDING") {
    throw new LeaveRequestNotPendingError();
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const leave = await repository.decide(tenantId, leaveId, {
      status: "REJECTED",
      approvedBy: actingUserId,
      approvedAt: new Date(),
      rejectionReason: parsed.data.rejectionReason,
      updatedBy: actingUserId,
    });
    await notifyGuardiansOfLeaveDecision(tenantId, existing.studentId, false, tx);
    return toHostelLeaveRequestDTO(leave);
  });
}

export async function cancelHostelLeave(leaveId: string, context: HostelContext): Promise<HostelLeaveRequestDTO> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaHostelLeaveRequestRepository();
  const existing = await repository.findById(tenantId, leaveId);
  if (!existing) {
    throw new HostelLeaveRequestNotFoundError();
  }
  if (existing.status !== "PENDING") {
    throw new LeaveRequestNotPendingError("Only a pending leave request can be cancelled.");
  }

  const leave = await repository.cancel(tenantId, leaveId, actingUserId);
  return toHostelLeaveRequestDTO(leave);
}
