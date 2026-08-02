import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/auth/session";
import { getCurrentUser, isUserProfileActive } from "@/lib/auth/current-user";
import { getCurrentSchool } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { getSchoolBranding } from "@/modules/branding/application/get-school-branding.service";
import { AppShellClient } from "@/components/layout/AppShellClient";
import { NAV_SECTIONS, type NavSection } from "@/components/layout/nav-sections";
import type { ShellBrandingInfo } from "@/components/layout/AppShellClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_METADATA: Metadata = {
  title: "EduPilot School ERP",
  description: "Multi-tenant School ERP for admissions, academics, attendance, fees, HR, and more.",
};

// Completion Pass — Browser title (checklist #4): dynamic per-tenant, replacing the static
// `export const metadata` this file used to have. Mirrors RootLayout's own
// getCurrentUser()/isUserProfileActive() gate below rather than requireAuthContext() (which
// redirects) — an anonymous visitor on `/`, `/login`, `/register` must still get a title, not a
// crash. Falls back to the platform default whenever no ACTIVE session/School exists yet (first
// paint, logged-out, or a brand-new tenant that hasn't set up their School row).
export async function generateMetadata(): Promise<Metadata> {
  const session = await getSession();
  if (!session) return DEFAULT_METADATA;

  const userProfile = await getCurrentUser();
  if (!userProfile || !isUserProfileActive(userProfile)) return DEFAULT_METADATA;

  const school = await getCurrentSchool().catch(() => null);
  if (!school) return DEFAULT_METADATA;

  return {
    ...DEFAULT_METADATA,
    title: `${school.schoolName} — EduPilot School ERP`,
  };
}

// Root layout is now async: it resolves the current session (never requireSession() — this
// layout must still render for anonymous visitors on `/`, `/login`, and `/register`) and, only
// when a session AND an ACTIVE UserProfile both exist, resolves the permission-filtered
// navSections + userDisplayName the AppShellClient sidebar needs.
//
// Deliberately checks getCurrentUser()/isUserProfileActive() BEFORE calling
// getAuthorizationContext(): that function calls requireAuthContext() internally, which
// REDIRECTS to /login for a session with no UserProfile or a non-ACTIVE one — exactly the
// force-redirect-from-the-landing-page edge case this layout must avoid. Gating on an
// already-confirmed-ACTIVE profile first means that internal call can never actually redirect
// here; it just re-resolves the same profile.
//
// Completion Pass — Sidebar/Theme branding (checklist #2, #6): once branding is resolved, it's
// threaded to AppShellClient as `branding` and its `themeColor` is written to a `--brand-color`
// CSS custom property on `<html>` via an inline style (server-rendered, no client JS/FOUC) — the
// one shared variable every branded surface (active nav link, buttons that opt in) reads from,
// per app/globals.css's own "no brand-color variable existed before this" gap.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  let navSections: NavSection[] = [];
  let userDisplayName: string | null = null;
  let branding: ShellBrandingInfo | null = null;

  if (session) {
    const userProfile = await getCurrentUser();

    if (userProfile && isUserProfileActive(userProfile)) {
      userDisplayName = userProfile.fullName;

      const authorization = await getAuthorizationContext();
      navSections = NAV_SECTIONS.map((section) => ({
        title: section.title,
        items: section.items.filter((item) => item.permission === null || can(authorization, item.permission)),
      })).filter((section) => section.items.length > 0);

      const school = await getCurrentSchool().catch(() => null);
      if (school) {
        const schoolBranding = await getSchoolBranding({ tenantId: userProfile.tenantId, school });
        branding = {
          schoolName: schoolBranding.schoolName,
          logoUrl: schoolBranding.logoUrl,
          themeColor: schoolBranding.themeColor,
        };
      }
    }
  }

  const brandColorStyle = branding?.themeColor
    ? ({ "--brand-color": branding.themeColor } as React.CSSProperties)
    : undefined;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={brandColorStyle}
    >
      <body className="min-h-full flex flex-col">
        <AppShellClient navSections={navSections} userDisplayName={userDisplayName} branding={branding}>
          {children}
        </AppShellClient>
      </body>
    </html>
  );
}
