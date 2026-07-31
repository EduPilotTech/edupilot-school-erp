import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can, requirePermission } from "@/lib/auth/rbac";
import { getEmployeeProfile } from "@/modules/hr/application/get-employee-profile.service";
import { getEmployeeBankDetail } from "@/modules/hr/application/employee-bank-detail.service";
import { listEmployeeDocuments } from "@/modules/hr/application/list-employee-documents.service";
import { EmployeeNotFoundError } from "@/modules/hr/domain/errors";
import { ValidationError } from "@/lib/errors";
import { ProfileTabs } from "./_components/profile-tabs";
import { OverviewTab } from "./_components/overview-tab";
import { BankDetailsTab } from "./_components/bank-details-tab";
import { DocumentsTab } from "./_components/documents-tab";
import { LettersTab } from "./_components/letters-tab";

interface EmployeeProfilePageProps {
  params: Promise<{ employeeId: string }>;
}

// Server Component — matches app/students/[studentId]/page.tsx's read pattern exactly:
// application services are called directly (pure reads), not through a Server Action, and the
// tab content is composed here from getEmployeeProfile + getEmployeeBankDetail +
// listEmployeeDocuments.
export default async function EmployeeProfilePage({ params }: EmployeeProfilePageProps) {
  const { employeeId } = await params;
  const authContext = await requireAuthContext();
  await requirePermission("hr.employee.manage");

  const authorization = await getAuthorizationContext();

  let profile;
  try {
    profile = await getEmployeeProfile(employeeId, { tenantId: authContext.tenantId });
  } catch (error) {
    if (error instanceof EmployeeNotFoundError || error instanceof ValidationError) {
      notFound();
    }
    throw error;
  }

  const [bankDetail, documents] = await Promise.all([
    getEmployeeBankDetail(employeeId, { tenantId: authContext.tenantId }),
    listEmployeeDocuments({ employeeId }, { tenantId: authContext.tenantId }),
  ]);

  const canManage = can(authorization, "hr.employee.manage");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <Link href="/hr/employees" className="text-sm text-blue-600 hover:underline">
          ← Back to Employees
        </Link>
        {canManage && (
          <Link
            href={`/hr/employees/${profile.id}/edit`}
            className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
          >
            Edit
          </Link>
        )}
      </div>

      <div className="mt-4">
        <ProfileTabs
          tabs={[
            { id: "overview", label: "Overview", content: <OverviewTab profile={profile} /> },
            {
              id: "bank-details",
              label: "Bank Details",
              content: <BankDetailsTab employeeId={profile.id} bankDetail={bankDetail} canManage={canManage} />,
            },
            {
              id: "documents",
              label: "Documents",
              content: <DocumentsTab employeeId={profile.id} documents={documents} canManage={canManage} />,
            },
            {
              id: "letters",
              label: "Letters",
              content: <LettersTab employeeId={profile.id} />,
            },
          ]}
        />
      </div>
    </main>
  );
}
