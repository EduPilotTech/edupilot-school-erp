import "server-only";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { PrismaDepartmentRepository } from "../infrastructure/prisma-department.repository";
import { PrismaDesignationRepository } from "../infrastructure/prisma-designation.repository";
import { PrismaEmploymentTypeRepository } from "../infrastructure/prisma-employment-type.repository";
import { PrismaEmployeeBankDetailRepository } from "../infrastructure/prisma-employee-bank-detail.repository";
import { PrismaEmployeeDocumentRepository } from "../infrastructure/prisma-employee-document.repository";
import { EmployeeNotFoundError } from "../domain/errors";
import { toEmployeeDTO } from "./employee.service";
import type { EmployeeProfileDTO } from "./dto/employee.dto";

// Section 2 of the Phase 13 spec — assembles the full Employee Profile read model: Employee
// fields + UserProfile identity + Department/Designation/EmploymentType names + reporting
// manager's name (if any) + bank-detail-on-file presence + document count. Composes existing
// reads only — no new repository method beyond what employee.service.ts/document/bank-detail
// repositories already expose.
export async function getEmployeeProfile(employeeId: string, context: { tenantId: string }): Promise<EmployeeProfileDTO> {
  const { tenantId } = context;

  const employeeRepository = new PrismaEmployeeRepository();
  const employee = await employeeRepository.findById(tenantId, employeeId);
  if (!employee || employee.deletedAt !== null) {
    throw new EmployeeNotFoundError();
  }

  const userDetail = await getUserDetail(employee.userProfileId, { tenantId });
  if (!userDetail) {
    throw new EmployeeNotFoundError();
  }

  const [department, designation, employmentType, reportingManager, bankDetail, documents] = await Promise.all([
    new PrismaDepartmentRepository().findById(tenantId, employee.departmentId),
    new PrismaDesignationRepository().findById(tenantId, employee.designationId),
    new PrismaEmploymentTypeRepository().findById(tenantId, employee.employmentTypeId),
    employee.reportingManagerId ? employeeRepository.findById(tenantId, employee.reportingManagerId) : Promise.resolve(null),
    new PrismaEmployeeBankDetailRepository().findByEmployeeId(tenantId, employeeId),
    new PrismaEmployeeDocumentRepository().findByEmployee(tenantId, employeeId),
  ]);

  let reportingManagerName: string | null = null;
  if (reportingManager) {
    const managerUserDetail = await getUserDetail(reportingManager.userProfileId, { tenantId });
    reportingManagerName = managerUserDetail?.profile.fullName ?? null;
  }

  return {
    ...toEmployeeDTO(employee, userDetail.profile),
    departmentName: department?.name ?? "",
    designationName: designation?.name ?? "",
    employmentTypeName: employmentType?.name ?? "",
    reportingManagerName,
    hasBankDetail: bankDetail !== null,
    documentCount: documents.length,
  };
}
