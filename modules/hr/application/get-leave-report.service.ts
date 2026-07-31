import "server-only";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { PrismaEmployeeLeaveRequestRepository } from "../infrastructure/prisma-employee-leave-request.repository";
import { PrismaLeaveTypeRepository } from "../infrastructure/prisma-leave-type.repository";
import type { LeaveReportFilter, LeaveReportRow } from "./dto/hr-reports.dto";

// Leave Report (Phase 13 spec §11.c) — leave requests joined with employee code/name and leave
// type name. Composes PrismaEmployeeLeaveRequestRepository.findMany +
// PrismaLeaveTypeRepository/PrismaEmployeeRepository lookups, no new repository methods.
export async function getLeaveReport(tenantId: string, filter: LeaveReportFilter): Promise<LeaveReportRow[]> {
  const requestRepository = new PrismaEmployeeLeaveRequestRepository();
  const requests = await requestRepository.findMany(tenantId, {
    employeeId: filter.employeeId,
    status: filter.status,
    fromDate: filter.fromDate,
    toDate: filter.toDate,
  });

  const filtered = filter.leaveTypeId
    ? requests.filter((request) => request.leaveTypeId === filter.leaveTypeId)
    : requests;

  const employeeRepository = new PrismaEmployeeRepository();
  const leaveTypeRepository = new PrismaLeaveTypeRepository();

  const employeeCache = new Map<string, { employeeCode: string; fullName: string }>();
  const leaveTypeCache = new Map<string, string>();

  return Promise.all(
    filtered.map(async (request): Promise<LeaveReportRow> => {
      let employeeInfo = employeeCache.get(request.employeeId);
      if (!employeeInfo) {
        const employee = await employeeRepository.findById(tenantId, request.employeeId);
        const userDetail = employee ? await getUserDetail(employee.userProfileId, { tenantId }) : null;
        employeeInfo = {
          employeeCode: employee?.employeeCode ?? "",
          fullName: userDetail?.profile.fullName ?? "",
        };
        employeeCache.set(request.employeeId, employeeInfo);
      }

      let leaveTypeName = leaveTypeCache.get(request.leaveTypeId);
      if (leaveTypeName === undefined) {
        const leaveType = await leaveTypeRepository.findById(tenantId, request.leaveTypeId);
        leaveTypeName = leaveType?.name ?? "";
        leaveTypeCache.set(request.leaveTypeId, leaveTypeName);
      }

      return {
        id: request.id,
        employeeId: request.employeeId,
        employeeCode: employeeInfo.employeeCode,
        employeeName: employeeInfo.fullName,
        leaveTypeName,
        fromDate: request.fromDate.toISOString().slice(0, 10),
        toDate: request.toDate.toISOString().slice(0, 10),
        isHalfDay: request.isHalfDay,
        totalDays: request.totalDays,
        status: request.status,
        reason: request.reason,
      };
    })
  );
}
