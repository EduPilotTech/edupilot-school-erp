import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getEmployeeProfile } from "@/modules/hr/application/get-employee-profile.service";
import { listDepartments } from "@/modules/hr/application/department.service";
import { listDesignations } from "@/modules/hr/application/designation.service";
import { listEmploymentTypes } from "@/modules/hr/application/employment-type.service";
import { listEmployees } from "@/modules/hr/application/employee.service";
import { EmployeeNotFoundError } from "@/modules/hr/domain/errors";
import { ValidationError } from "@/lib/errors";
import { EmployeeEditForm } from "@/components/features/hr/EmployeeEditForm";

interface EditEmployeePageProps {
  params: Promise<{ employeeId: string }>;
}

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  const { employeeId } = await params;
  const authContext = await requireAuthContext();
  await requirePermission("hr.employee.manage");

  let profile;
  try {
    profile = await getEmployeeProfile(employeeId, { tenantId: authContext.tenantId });
  } catch (error) {
    if (error instanceof EmployeeNotFoundError || error instanceof ValidationError) {
      notFound();
    }
    throw error;
  }

  const [departments, designations, employmentTypes, allEmployees] = await Promise.all([
    listDepartments({ tenantId: authContext.tenantId }),
    listDesignations({ tenantId: authContext.tenantId }),
    listEmploymentTypes({ tenantId: authContext.tenantId }),
    listEmployees({ page: 1, pageSize: 100 }, { tenantId: authContext.tenantId }),
  ]);

  // A reporting manager cannot be the employee themselves — excluded from the candidate list,
  // mirroring createEmployee/updateEmployee.service.ts's own InvalidReportingManagerError guard.
  const reportingManagerCandidates = allEmployees.items.filter((employee) => employee.id !== profile.id);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href={`/hr/employees/${profile.id}`} className="text-sm text-blue-600 hover:underline">
        ← Back to Profile
      </Link>

      <div className="mb-6 mt-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Employee</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Update {profile.fullName}&apos;s department, designation, and employment details.
        </p>
      </div>

      <EmployeeEditForm
        profile={profile}
        departments={departments}
        designations={designations}
        employmentTypes={employmentTypes}
        reportingManagerCandidates={reportingManagerCandidates}
      />
    </main>
  );
}
