import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listSchoolsForManagement } from "@/modules/billing/application/school-management.service";
import { SchoolManager } from "@/components/features/platform/SchoolManager";

export default async function PlatformSchoolsPage() {
  await requireAuthContext();
  await requirePermission("platform.billing.manage");

  const schools = await listSchoolsForManagement();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/platform" className="text-sm text-blue-600 hover:underline">
        ← Platform Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">School Management</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Every school on the platform, its subscription plan/status, and its account status.
      </p>

      <div className="mt-6">
        <SchoolManager items={schools} />
      </div>
    </main>
  );
}
