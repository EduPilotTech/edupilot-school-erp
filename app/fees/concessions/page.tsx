import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listStudents } from "@/modules/students/application/list-students.service";
import { listFeeCategories } from "@/modules/fees/application/list-fee-categories.service";
import { listConcessionsForStudent } from "@/modules/fees/application/list-concessions.service";
import { ConcessionManager } from "@/components/features/fees/ConcessionManager";

interface ConcessionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ConcessionsPage({ searchParams }: ConcessionsPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("fee.concession.view");
  const authorization = await getAuthorizationContext();

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const search = first(params.q) ?? "";
  const studentId = first(params.studentId) ?? "";

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = sessions[0]?.id ?? "";

  const studentResult = search
    ? await listStudents({ search, page: 1, pageSize: 20 }, { tenantId: authContext.tenantId })
    : { items: [], total: 0, page: 1, pageSize: 20 };
  const selectedStudent = studentResult.items.find((student) => student.id === studentId);

  const categories = await listFeeCategories({ tenantId: authContext.tenantId });
  const concessions =
    studentId && academicSessionId
      ? await listConcessionsForStudent(authContext.tenantId, studentId, academicSessionId)
      : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Concessions &amp; Waivers</h1>
      <p className="mt-1 text-sm text-zinc-500">Discounts, scholarships, sibling/staff-ward concessions, and full waivers.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs font-medium text-zinc-500">
            Search Student
          </label>
          <input
            id="q"
            name="q"
            defaultValue={search}
            placeholder="Admission number or name"
            className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Search
        </button>
      </form>

      {!studentId && studentResult.items.length > 0 && (
        <ul className="mt-6 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
          {studentResult.items.map((student) => (
            <li key={student.id} className="px-4 py-2 text-sm">
              <a
                href={`/fees/concessions?q=${encodeURIComponent(search)}&studentId=${student.id}`}
                className="text-blue-600 hover:underline"
              >
                {student.admissionNumber} — {student.firstName} {student.lastName}
              </a>
            </li>
          ))}
        </ul>
      )}

      {studentId && selectedStudent && (
        <div className="mt-8">
          <h2 className="text-base font-semibold text-zinc-900">
            {selectedStudent.admissionNumber} — {selectedStudent.firstName} {selectedStudent.lastName}
          </h2>
          <div className="mt-3">
            <ConcessionManager
              studentId={studentId}
              academicSessionId={academicSessionId}
              concessions={concessions}
              categories={categories.map((category) => ({ id: category.id, name: category.name }))}
              canManage={can(authorization, "fee.concession.manage")}
            />
          </div>
        </div>
      )}
    </main>
  );
}
