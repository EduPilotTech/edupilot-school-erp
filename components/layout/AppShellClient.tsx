"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";
import type { NavSection } from "./nav-sections";

// Completion Pass — Sidebar branding (checklist #2). The subset of SchoolBrandingDTO the shell
// actually needs — kept as its own small interface here (not importing SchoolBrandingDTO
// directly) so this shared layout component doesn't pull in the full branding module's DTO
// surface for three fields.
export interface ShellBrandingInfo {
  schoolName: string;
  logoUrl: string | null;
  themeColor: string | null;
}

interface AppShellClientProps {
  children: ReactNode;
  navSections: NavSection[];
  userDisplayName: string | null;
  branding: ShellBrandingInfo | null;
}

// Routes that render with no chrome at all — the public landing page and every anonymous auth
// page. Everything else gets the persistent two-column shell.
const PLAIN_ROUTE_PREFIXES = ["/login", "/register", "/forgot-password"];

function isPlainRoute(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }
  return PLAIN_ROUTE_PREFIXES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// The first persistent chrome in this app — usePathname() decides at render time whether to
// show it at all, since this Client Component sits above every route (wired in the root
// app/layout.tsx) but must render invisibly on the public landing page and the anonymous auth
// pages. navSections arrives already permission-filtered from the server (see app/layout.tsx) —
// this component never resolves authorization itself.
export function AppShellClient({ children, navSections, userDisplayName, branding }: AppShellClientProps) {
  const pathname = usePathname();

  if (isPlainRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-200 px-6">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
            {branding?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed URL from Supabase Storage.
              <img src={branding.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-contain" />
            ) : null}
            <span className="truncate text-base font-semibold text-zinc-900">
              {branding?.schoolName ?? "EduPilot"}
            </span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
          {navSections.map((section) =>
            section.items.length === 0 ? null : (
              <div key={section.title}>
                <p className="px-3 text-xs font-medium uppercase tracking-wide text-zinc-500">{section.title}</p>
                <div className="mt-2 flex flex-col gap-0.5">
                  {section.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                          active ? "font-medium" : "text-zinc-700 hover:bg-zinc-100"
                        }`}
                        style={
                          active
                            ? { backgroundColor: "color-mix(in srgb, var(--brand-color) 12%, white)", color: "var(--brand-color)" }
                            : undefined
                        }
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-end gap-4 border-b border-zinc-200 bg-white px-6">
          {userDisplayName && <span className="text-sm text-zinc-700">{userDisplayName}</span>}
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              Log out
            </button>
          </form>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
