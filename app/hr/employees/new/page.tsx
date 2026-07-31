import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listDepartments } from "@/modules/hr/application/department.service";
import { listDesignations } from "@/modules/hr/application/designation.service";
import { listEmploymentTypes } from "@/modules/hr/application/employment-type.service";
import { listEmployees } from "@/modules/hr/application/employee.service";
import { listUsers } from "@/modules/users/application/list-users.service";
import { EmployeeCreateForm } from "@/components/features/hr/EmployeeCreateForm";

// Server Component wrapper, mirroring app/students/new/page.tsx's shape: gathers every option
// list the form needs, then hands off to a Client Component. Real `hr.employee.manage`
// enforcement lives on createEmployeeAction — this page-level check is a UX gate only, matching
// the same reasoning already established at app/students/new/page.tsx and
// app/hostel/hostels/[hostelId]/page.tsx.
export default async function NewEmployeePage() {
  const authContext = await requireAuthContext();
  await requirePermission("hr.employee.manage");

  const [departments, designations, employmentTypes, existingEmployees, activeUsers] = await Promise.all([
    listDepartments({ tenantId: authContext.tenantId }),
    listDesignations({ tenantId: authContext.tenantId }),
    listEmploymentTypes({ tenantId: authContext.tenantId }),
    listEmployees({ page: 1, pageSize: 100 }, { tenantId: authContext.tenantId }),
    listUsers({ status: "ACTIVE", page: 1, pageSize: 100 }, { tenantId: authContext.tenantId }),
  ]);

  // Promotes an existing UserProfile into an Employee record — never creates a new UserProfile,
  // mirroring app/teachers/page.tsx's exact precedent (Phase 6 Decision 1). `candidates` is every
  // active user who does not already have an Employee record.
  const alreadyEmployee = new Set(existingEmployees.items.map((employee) => employee.userProfileId));
  const candidates = activeUsers.items
    .filter((user) => user.deletedAt === null && !alreadyEmployee.has(user.id))
    .map((user) => ({ id: user.id, fullName: user.fullName, email: user.email }));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/hr/employees" className="text-sm text-blue-600 hover:underline">
        ← Employees
      </Link>

      <div className="mb-6 mt-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Add Employee</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Promote an existing staff member into an employee record with department, designation, and employment details.
        </p>
      </div>

      <EmployeeCreateForm
        candidates={candidates}
        departments={departments}
        designations={designations}
        employmentTypes={employmentTypes}
        reportingManagerCandidates={existingEmployees.items}
      />
    </main>
  );
}
