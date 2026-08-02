import Link from "next/link";
import { requireAuthContext, getCurrentSchool } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { getSchoolBranding } from "@/modules/branding/application/get-school-branding.service";
import { NAV_SECTIONS } from "@/components/layout/nav-sections";

// Navigation + welcome only, deliberately — no new aggregate "dashboard stats" service is built
// here (that would be new business logic; per-module dashboards like HR Dashboard and Billing
// Dashboard already exist and are reachable from the sidebar). Reuses NAV_SECTIONS
// (components/layout/nav-sections.ts) for its card grid rather than maintaining a second
// hand-written link list — the "Overview" section is skipped since a link back to /dashboard
// from /dashboard itself is pointless.
export default async function DashboardPage() {
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const school = await getCurrentSchool();
  const branding = await getSchoolBranding({ tenantId: authContext.tenantId, school });

  const sections = NAV_SECTIONS.filter((section) => section.title !== "Overview")
    .map((section) => ({
      title: section.title,
      items: section.items.filter((item) => item.permission === null || can(authorization, item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5">
        {branding.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL from Supabase Storage.
          <img src={branding.logoUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-contain" />
        ) : (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
            style={{ backgroundColor: branding.themeColor ?? "var(--brand-color)" }}
          >
            {branding.schoolName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-zinc-900">{branding.schoolName}</p>
          {branding.motto && <p className="truncate text-sm italic text-zinc-500">&ldquo;{branding.motto}&rdquo;</p>}
        </div>
      </div>

      <h1 className="mt-6 text-2xl font-semibold text-zinc-900">Welcome, {authContext.userProfile.fullName}</h1>
      <p className="mt-1 text-sm text-zinc-500">Everything you have access to, in one place.</p>

      <div className="mt-8 flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">{section.title}</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400"
                >
                  <h3 className="text-base font-semibold text-zinc-900">{item.label}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
