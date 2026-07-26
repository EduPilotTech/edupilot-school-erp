import { Fragment } from "react";

const FOUNDATION_VERSION = "v0.1.0-foundation";
const RELEASE_TAG = "v0.1.0";

const NAV_LINKS = ["Home", "Documentation", "Roadmap", "GitHub"];

const TECH_STACK: { name: string; mark: string }[] = [
  { name: "Next.js 16", mark: "N" },
  { name: "Prisma 7", mark: "P" },
  { name: "PostgreSQL", mark: "PG" },
  { name: "Supabase", mark: "S" },
  { name: "TypeScript", mark: "TS" },
  { name: "Tailwind CSS", mark: "TW" },
];

const STATS: { label: string; value: string }[] = [
  { label: "Foundation Models", value: "3" },
  { label: "Architecture", value: "Enterprise" },
  { label: "Database", value: "PostgreSQL" },
  { label: "Framework", value: "Next.js 16" },
  { label: "Validation", value: "100%" },
  { label: "Git Release", value: RELEASE_TAG },
];

const COMPLETED_MODULES = [
  "Tenant",
  "School",
  "Academic Session",
  "Multi Tenant Foundation",
  "Prisma Configuration",
  "PostgreSQL",
  "Supabase Ready",
];

type RoadmapStatus = "Completed" | "Next" | "Upcoming";

const ROADMAP_BADGE_STYLES: Record<RoadmapStatus, string> = {
  Completed: "bg-emerald-500/10 text-emerald-400",
  Next: "bg-blue-500/10 text-blue-400",
  Upcoming: "bg-zinc-800 text-zinc-400",
};

const ROADMAP_DOT_STYLES: Record<RoadmapStatus, string> = {
  Completed: "bg-emerald-500",
  Next: "bg-blue-500",
  Upcoming: "bg-zinc-700",
};

const ROADMAP: { phase: number; title: string; status: RoadmapStatus }[] = [
  { phase: 0, title: "Foundation", status: "Completed" },
  { phase: 1, title: "RBAC", status: "Next" },
  { phase: 2, title: "Authentication", status: "Upcoming" },
  { phase: 3, title: "School Configuration", status: "Upcoming" },
  { phase: 4, title: "Student Management", status: "Upcoming" },
  { phase: 5, title: "Attendance", status: "Upcoming" },
  { phase: 6, title: "Fee Management", status: "Upcoming" },
  { phase: 7, title: "Examination", status: "Upcoming" },
];

const ARCHITECTURE_FLOW = [
  "Tenant",
  "School",
  "Academic Session",
  "Users",
  "Students",
  "Attendance",
  "Fees",
  "Exams",
];

const BUILT_WITH = ["Next.js", "Prisma", "PostgreSQL", "Supabase"];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-zinc-50">EduPilot</span>
            <span className="text-sm text-zinc-500">School ERP</span>
          </div>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-8 text-sm text-zinc-400">
              {NAV_LINKS.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-zinc-50">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
              {RELEASE_TAG}
            </span>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-lg border border-zinc-800 px-4 py-1.5 text-sm font-medium text-zinc-500"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-28 px-6 py-24">
        <section className="flex flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-400">
            Foundation Completed
          </span>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">
            EduPilot School ERP
          </h1>

          <p className="max-w-2xl text-lg text-zinc-400 sm:text-xl">
            Enterprise-grade Multi-Tenant School Management Platform
          </p>

          <p className="max-w-xl text-sm text-zinc-500">
            Built with Next.js 16, Prisma 7, PostgreSQL and Supabase using enterprise
            architecture.
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#"
              className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-400"
            >
              View Documentation
            </a>
            <a
              href="#"
              className="rounded-lg border border-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-700"
            >
              GitHub Repository
            </a>
          </div>
        </section>

        <section aria-labelledby="stack-heading" className="flex flex-col gap-8">
          <h2
            id="stack-heading"
            className="text-sm font-medium uppercase tracking-wide text-zinc-500"
          >
            Technology Stack
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.name}
                className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-6 text-center"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-sm font-semibold text-blue-400">
                  {tech.mark}
                </span>
                <span className="text-sm font-medium text-zinc-200">{tech.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="stats-heading" className="flex flex-col gap-8">
          <h2
            id="stats-heading"
            className="text-sm font-medium uppercase tracking-wide text-zinc-500"
          >
            Foundation Statistics
          </h2>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg shadow-black/20"
              >
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {stat.label}
                </dt>
                <dd className="mt-2 text-2xl font-semibold text-zinc-50">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="modules-heading" className="flex flex-col gap-8">
          <h2
            id="modules-heading"
            className="text-sm font-medium uppercase tracking-wide text-zinc-500"
          >
            Completed Modules
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMPLETED_MODULES.map((module) => (
              <li
                key={module}
                className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4"
              >
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-400"
                >
                  ✓
                </span>
                <span className="text-sm font-medium text-zinc-200">{module}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="roadmap-heading" className="flex flex-col gap-8">
          <h2
            id="roadmap-heading"
            className="text-sm font-medium uppercase tracking-wide text-zinc-500"
          >
            Development Roadmap
          </h2>
          <ol className="flex flex-col gap-8 border-l border-zinc-800 pl-8">
            {ROADMAP.map((item) => (
              <li key={item.phase} className="relative">
                <span
                  aria-hidden="true"
                  className={`absolute -left-[41px] top-1 h-3 w-3 rounded-full border-2 border-zinc-950 ${ROADMAP_DOT_STYLES[item.status]}`}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Phase {item.phase}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROADMAP_BADGE_STYLES[item.status]}`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-base font-semibold text-zinc-100">{item.title}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="architecture-heading" className="flex flex-col items-center gap-8">
          <h2
            id="architecture-heading"
            className="text-sm font-medium uppercase tracking-wide text-zinc-500"
          >
            Architecture
          </h2>
          <div className="flex flex-col items-center gap-2">
            {ARCHITECTURE_FLOW.map((node, index) => (
              <Fragment key={node}>
                {index > 0 && (
                  <span aria-hidden="true" className="text-zinc-700">
                    ↓
                  </span>
                )}
                <div className="w-full max-w-xs rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-3 text-center text-sm font-medium text-zinc-200">
                  {node}
                </div>
              </Fragment>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-zinc-50">EduPilot Technologies</p>
              <p className="mt-1 text-sm text-zinc-500">Enterprise School ERP</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Version
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-300">{FOUNDATION_VERSION}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Built With
              </p>
              <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-300">
                {BUILT_WITH.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="border-t border-zinc-800 pt-6 text-center text-xs text-zinc-500">
            © 2026 EduPilot Technologies
          </p>
        </div>
      </footer>
    </div>
  );
}
