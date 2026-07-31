import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMyProfile } from "@/modules/hr/application/employee-portal.service";
import { EmployeeNotFoundError } from "@/modules/hr/domain/errors";
import { resolveCurrentEmployeeId } from "../_lib/resolve-current-employee";
import { ProfileForm } from "@/components/features/employee-portal/ProfileForm";

export default async function EmployeePortalProfilePage() {
  const authContext = await requireAuthContext();
  await requirePermission("employee.portal.access");

  let employeeId: string;
  try {
    employeeId = await resolveCurrentEmployeeId(authContext.tenantId, authContext.userId);
  } catch (error) {
    if (error instanceof EmployeeNotFoundError) {
      return (
        <main className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-semibold text-zinc-900">My Profile</h1>
          <p className="mt-4 text-sm text-zinc-500">No employee record is linked to your account. Contact HR.</p>
        </main>
      );
    }
    throw error;
  }

  const profile = await getMyProfile(authContext.tenantId, employeeId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/employee-portal" className="text-sm text-blue-600 hover:underline">
        ← Employee Portal
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">My Profile</h1>
      <p className="mt-1 text-sm text-zinc-500">{profile.fullName} ({profile.employeeCode})</p>

      <div className="mt-6">
        <ProfileForm profile={profile} />
      </div>
    </main>
  );
}
