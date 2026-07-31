import "server-only";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { PrismaDepartmentRepository } from "../infrastructure/prisma-department.repository";
import { PrismaDesignationRepository } from "../infrastructure/prisma-designation.repository";
import { computeTenureYears } from "./hr-date.helpers";
import type { ExperienceReportRow } from "./dto/hr-reports.dto";

const MAX_EMPLOYEES_PER_SCHOOL = 100000;

// Experience Report (Phase 13 spec §11.g) — every employee at a school with their prior
// (pre-joining) `experienceYears` and their `tenureYears` at this school, computed from
// `joiningDate` to now via the pure `computeTenureYears` helper.
export async function getExperienceReport(tenantId: string, schoolId: string): Promise<ExperienceReportRow[]> {
  const employeeRepository = new PrismaEmployeeRepository();
  const { items: allEmployees } = await employeeRepository.findMany(tenantId, { page: 1, pageSize: MAX_EMPLOYEES_PER_SCHOOL });
  const employees = allEmployees.filter((employee) => employee.schoolId === schoolId && employee.deletedAt === null);

  const [departments, designations] = await Promise.all([
    new PrismaDepartmentRepository().findMany(tenantId),
    new PrismaDesignationRepository().findMany(tenantId),
  ]);
  const departmentNameById = new Map(departments.map((department) => [department.id, department.name]));
  const designationNameById = new Map(designations.map((designation) => [designation.id, designation.name]));

  const now = new Date();

  return Promise.all(
    employees.map(async (employee): Promise<ExperienceReportRow> => {
      const userDetail = await getUserDetail(employee.userProfileId, { tenantId });
      return {
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        fullName: userDetail?.profile.fullName ?? "",
        departmentName: departmentNameById.get(employee.departmentId) ?? "",
        designationName: designationNameById.get(employee.designationId) ?? "",
        joiningDate: employee.joiningDate,
        experienceYears: employee.experienceYears,
        tenureYears: computeTenureYears(employee.joiningDate, now),
      };
    })
  );
}
