import "server-only";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { PrismaDepartmentRepository } from "../infrastructure/prisma-department.repository";
import type { DepartmentSummaryReportRow } from "./dto/hr-reports.dto";

const MAX_EMPLOYEES_PER_SCHOOL = 100000;

// Department Summary Report (Phase 13 spec §11.f) — per department: total employee count, active
// count, and on-leave count. `onLeaveCount` reflects `employmentStatus === "ON_LEAVE"` (a standing
// HR status, e.g. maternity/sabbatical leave), not a daily attendance "LEAVE" mark — the two are
// deliberately different signals, per the task brief.
export async function getDepartmentSummaryReport(tenantId: string, schoolId: string): Promise<DepartmentSummaryReportRow[]> {
  const [departments, { items: allEmployees }] = await Promise.all([
    new PrismaDepartmentRepository().findMany(tenantId),
    new PrismaEmployeeRepository().findMany(tenantId, { page: 1, pageSize: MAX_EMPLOYEES_PER_SCHOOL }),
  ]);

  const employees = allEmployees.filter((employee) => employee.schoolId === schoolId && employee.deletedAt === null);

  return departments.map((department): DepartmentSummaryReportRow => {
    const departmentEmployees = employees.filter((employee) => employee.departmentId === department.id);
    return {
      departmentId: department.id,
      departmentName: department.name,
      employeeCount: departmentEmployees.length,
      activeCount: departmentEmployees.filter((employee) => employee.employmentStatus === "ACTIVE").length,
      onLeaveCount: departmentEmployees.filter((employee) => employee.employmentStatus === "ON_LEAVE").length,
    };
  });
}
