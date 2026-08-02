import { requireAuthContext, getCurrentSchool } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can, requirePermission } from "@/lib/auth/rbac";
import { getSchoolBranding } from "@/modules/branding/application/get-school-branding.service";
import { SchoolBrandingManager } from "@/components/features/branding/SchoolBrandingManager";

export default async function SchoolBrandingPage() {
  const authContext = await requireAuthContext();
  await requirePermission("school.branding.view");
  const authorization = await getAuthorizationContext();

  const school = await getCurrentSchool();
  const branding = await getSchoolBranding({ tenantId: authContext.tenantId, school });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">School Branding</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Logo, letterhead, principal signature, school seal, theme color, motto, and social links —
        used across every printed document (ID cards, receipts, report cards).
      </p>

      <div className="mt-6">
        <SchoolBrandingManager branding={branding} canManage={can(authorization, "school.branding.manage")} />
      </div>
    </main>
  );
}
