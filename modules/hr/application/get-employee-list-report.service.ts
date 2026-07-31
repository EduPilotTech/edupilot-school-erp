import "server-only";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { PrismaDepartmentRepository } from "../infrastructure/prisma-department.repository";
import { PrismaDesignationRepository } from "../infrastructure/prisma-designation.repository";
import { PrismaEmploymentTypeRepository } from "../infrastructure/prisma-employment-type.repository";
import type { EmployeeListReportFilter, EmployeeListReportRow } from "./dto/hr-reports.dto";

// EmployeeRepository.findMany has no schoolId filter of its own (tenant-wide) — fetched in one
// page and filtered by schoolId in application code here, mirroring processPayrollRun's own
// precedent (modules/payroll/application/payroll-run.service.ts).
const MAX_EMPLOYEES_PER_SCHOOL = 100000;

// Employee List Report (Phase 13 spec §11.a) — every employee at a school, joined with
// UserProfile identity + Department/Designation/EmploymentType names. Composes existing reads
// only, no new repository methods.
export async function getEmployeeListReport(
  tenantId: string,
  schoolId: string,
  filter?: EmployeeListReportFilter
): Promise<EmployeeListReportRow[]> {
  const employeeRepository = new PrismaEmployeeRepository();
  const { items: allEmployees } = await employeeRepository.findMany(tenantId, {
    page: 1,
    pageSize: MAX_EMPLOYEES_PER_SCHOOL,
    departmentId: filter?.departmentId,
    employmentStatus: filter?.employmentStatus,
  });

  const employees = allEmployees.filter(
    (employee) =>
      employee.schoolId === schoolId &&
      employee.deletedAt === null &&
      (!filter?.designationId || employee.designationId === filter.designationId)
  );

  const [departments, designations, employmentTypes] = await Promise.all([
    new PrismaDepartmentRepository().findMany(tenantId),
    new PrismaDesignationRepository().findMany(tenantId),
    new PrismaEmploymentTypeRepository().findMany(tenantId),
  ]);
  const departmentNameById = new Map(departments.map((department) => [department.id, department.name]));
  const designationNameById = new Map(designations.map((designation) => [designation.id, designation.name]));
  const employmentTypeNameById = new Map(employmentTypes.map((employmentType) => [employmentType.id, employmentType.name]));

  return Promise.all(
    employees.map(async (employee): Promise<EmployeeListReportRow> => {
      const userDetail = await getUserDetail(employee.userProfileId, { tenantId });
      return {
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        fullName: userDetail?.profile.fullName ?? "",
        departmentName: departmentNameById.get(employee.departmentId) ?? "",
        designationName: designationNameById.get(employee.designationId) ?? "",
        employmentTypeName: employmentTypeNameById.get(employee.employmentTypeId) ?? "",
        employmentStatus: employee.employmentStatus,
        joiningDate: employee.joiningDate,
      };
    })
  );
}
