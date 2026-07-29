import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listStudents } from "@/modules/students/application/list-students.service";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listClasses } from "@/modules/academics/application/list-classes.service";
import { listSections } from "@/modules/academics/application/list-sections.service";
import { PaginationLinks } from "./_components/pagination-links";
import { StudentsTableWithSelection } from "./_components/students-table-with-selection";

interface StudentsListPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const STATUS_OPTIONS = ["ACTIVE", "TRANSFERRED", "GRADUATED", "WITHDRAWN"] as const;
const SORT_OPTIONS = [
  { value: "admissionNumber", label: "Admission Number" },
  { value: "name", label: "Name" },
  { value: "admissionDate", label: "Admission Date" },
] as const;

// Server Component, matching app/settings/users/page.tsx's established list-page pattern
// exactly: GET-form filtering (no client JS needed), read services called directly (no Server
// Action — this is a pure read, and no other list page in this codebase wraps reads in a Server
// Action). Viewing requires only an authenticated, ACTIVE tenant member — no dedicated
// `student.view` permission is invented here, following the same precedent and reasoning as
// UsersListPage ("no dedicated view permission was ever defined... this page deliberately does
// not invent one"). The one gated action is the "New Admission" link, using the `student.admit`
// permission code already established in Sprint 4 — Step 4.
export default async function StudentsListPage({ searchParams }: StudentsListPageProps) {
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const params = await searchParams;

  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const [{ items, total, page, pageSize }, sessions, classes, sections] = await Promise.all([
    listStudents(
      {
        search: first(params.search),
        status: first(params.status),
        academicSessionId: first(params.academicSessionId),
        classId: first(params.classId),
        sectionId: first(params.sectionId),
        sortBy: first(params.sortBy),
        sortDirection: first(params.sortDirection),
        page: first(params.page),
        pageSize: first(params.pageSize),
      },
      { tenantId: authContext.tenantId }
    ),
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
    listClasses({ tenantId: authContext.tenantId }),
    listSections({ tenantId: authContext.tenantId }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Students</h1>
        {can(authorization, "student.admit") && (
          <Link
            href="/students/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            New Admission
          </Link>
        )}
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="search" className="text-xs font-medium text-zinc-500">
            Search
          </label>
          <input
            id="search"
            name="search"
            defaultValue={first(params.search) ?? ""}
            placeholder="Admission #, name, guardian, or mobile"
            className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="academicSessionId" className="text-xs font-medium text-zinc-500">
            Academic Session
          </label>
          <select
            id="academicSessionId"
            name="academicSessionId"
            defaultValue={first(params.academicSessionId) ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All sessions</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="classId" className="text-xs font-medium text-zinc-500">
            Class
          </label>
          <select
            id="classId"
            name="classId"
            defaultValue={first(params.classId) ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All classes</option>
            {classes.map((classEntity) => (
              <option key={classEntity.id} value={classEntity.id}>
                {classEntity.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sectionId" className="text-xs font-medium text-zinc-500">
            Section
          </label>
          <select
            id="sectionId"
            name="sectionId"
            defaultValue={first(params.sectionId) ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All sections</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs font-medium text-zinc-500">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={first(params.status) ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sortBy" className="text-xs font-medium text-zinc-500">
            Sort By
          </label>
          <select
            id="sortBy"
            name="sortBy"
            defaultValue={first(params.sortBy) ?? "admissionNumber"}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sortDirection" className="text-xs font-medium text-zinc-500">
            Direction
          </label>
          <select
            id="sortDirection"
            name="sortDirection"
            defaultValue={first(params.sortDirection) ?? "asc"}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Filter
        </button>
      </form>

      <div className="mt-6">
        <StudentsTableWithSelection items={items} canPrintIdCards={can(authorization, "student.idcard.print")} />
      </div>

      <PaginationLinks page={page} totalPages={totalPages} searchParams={params} />
    </main>
  );
}
