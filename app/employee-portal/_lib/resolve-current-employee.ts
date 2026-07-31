import "server-only";
import { PrismaEmployeeRepository } from "@/modules/hr/infrastructure/prisma-employee.repository";
import { EmployeeNotFoundError } from "@/modules/hr/domain/errors";

// Security-critical boundary (Phase 13 spec: "Employee can access ONLY own records") — every
// Employee Portal page/action resolves "my" employeeId THROUGH the caller's own authenticated
// session, never from a query param, hidden form field, or request body. A client could
// otherwise pass an arbitrary employeeId and read/mutate another employee's attendance, leave,
// payslips, documents, or personal info.
//
// Near-identical to app/api/employee/v1/_lib/resolve-current-employee.ts (the REST API's own
// version of this same boundary) — kept as a separate file because the web portal takes
// `(tenantId, userId)` directly from `requireAuthContext()` rather than an `ApiAuthContext`
// object, and because app/api/employee/v1/** is explicitly out of scope to import from/modify
// for this piece of work.
//
// Throws EmployeeNotFoundError (a normal, handled state — not a permission error) when the
// current user has no Employee record at all. This legitimately happens for accounts such as a
// PARENT or SUPER_ADMIN with `employee.portal.access` but no HR record; every portal page must
// catch this and render a friendly message instead of letting it bubble up as a 500.
export async function resolveCurrentEmployeeId(tenantId: string, userId: string): Promise<string> {
  const employee = await new PrismaEmployeeRepository().findByUserProfileId(tenantId, userId);
  if (!employee || employee.deletedAt !== null) {
    throw new EmployeeNotFoundError("No employee record is linked to your account. Please contact HR.");
  }
  return employee.id;
}
