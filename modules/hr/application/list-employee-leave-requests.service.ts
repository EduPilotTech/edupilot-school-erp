import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaEmployeeLeaveRequestRepository } from "../infrastructure/prisma-employee-leave-request.repository";
import { listEmployeeLeaveRequestsSchema, type EmployeeLeaveRequestDTO } from "./dto/leave.dto";
import { toEmployeeLeaveRequestDTO } from "./apply-for-leave.service";

export async function listLeaveRequests(input: unknown, context: { tenantId: string }): Promise<EmployeeLeaveRequestDTO[]> {
  const parsed = listEmployeeLeaveRequestsSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid filter.");
  }
  const { employeeId, status, fromDate, toDate } = parsed.data;
  const repository = new PrismaEmployeeLeaveRequestRepository();
  const requests = await repository.findMany(context.tenantId, { employeeId, status, fromDate, toDate });
  return requests.map(toEmployeeLeaveRequestDTO);
}
