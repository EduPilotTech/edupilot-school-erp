import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelLeaveRequestRepository } from "../infrastructure/prisma-hostel-leave-request.repository";
import { HostelLeaveRequestNotFoundError } from "../domain/errors";
import { recordHostelLeaveReturnSchema, type HostelLeaveRequestDTO } from "./dto/hostel-leave-request.dto";
import { toHostelLeaveRequestDTO } from "./request-hostel-leave.service";
import type { HostelContext } from "./create-hostel.service";

// Return Date tracking (requirement) — recorded independently of the leave's own toDate, so a
// warden can see at a glance whether a student returned on time, early, or late.
export async function recordHostelLeaveReturn(
  leaveId: string,
  input: unknown,
  context: HostelContext
): Promise<HostelLeaveRequestDTO> {
  const parsed = recordHostelLeaveReturnSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid return date.");
  }
  const { tenantId, actingUserId } = context;

  const repository = new PrismaHostelLeaveRequestRepository();
  const existing = await repository.findById(tenantId, leaveId);
  if (!existing) {
    throw new HostelLeaveRequestNotFoundError();
  }
  if (existing.status !== "APPROVED") {
    throw new ValidationError("Only an approved leave request can have a return recorded.");
  }

  const leave = await repository.recordReturn(tenantId, leaveId, parsed.data.actualReturnDate, actingUserId);
  return toHostelLeaveRequestDTO(leave);
}
