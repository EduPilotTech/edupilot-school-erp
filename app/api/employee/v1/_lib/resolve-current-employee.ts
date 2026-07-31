import "server-only";
import { PrismaEmployeeRepository } from "@/modules/hr/infrastructure/prisma-employee.repository";
import { EmployeeNotFoundError } from "@/modules/hr/domain/errors";
import type { ApiAuthContext } from "./api-auth";

// Security-critical boundary (Phase 13 spec: "Employee can access ONLY own records") — every
// Employee Portal route resolves "my" employeeId THROUGH the caller's own authenticated session,
// never from a query param or request body. A client could otherwise pass an arbitrary employeeId
// and read another employee's attendance/leave/payslips/documents.
//
// Mirrors modules/hr/application/employee-portal.service.ts's own `requireEmployee` helper
// (soft-delete-aware), resolved by userProfileId rather than a pre-known employeeId since the API
// layer only ever starts from the authenticated UserProfile.
export async function resolveCurrentEmployeeId(context: ApiAuthContext): Promise<string> {
  const employee = await new PrismaEmployeeRepository().findByUserProfileId(context.tenantId, context.userId);
  if (!employee || employee.deletedAt !== null) {
    throw new EmployeeNotFoundError("No employee record is linked to your account.");
  }
  return employee.id;
}
