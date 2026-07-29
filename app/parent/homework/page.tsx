import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listMyChildren } from "@/modules/parents/application/list-my-children.service";
import { getMyHomework } from "@/modules/parents/application/get-my-homework.service";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Homework (requirement 12, view-only per Decision 3) — no student submission workflow, just the
// assignment list for the selected child's class/section.
export default async function ParentHomeworkPage({ searchParams }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("parent.homework.view");

  const children = await listMyChildren({ tenantId: authContext.tenantId, userProfileId: authContext.userId });
  const params = await searchParams;
  const requested = Array.isArray(params.studentId) ? params.studentId[0] : params.studentId;
  const studentId = requested && children.some((child) => child.studentId === requested) ? requested : children[0]?.studentId;

  const homework = studentId
    ? await getMyHomework(studentId, { tenantId: authContext.tenantId, userProfileId: authContext.userId })
    : [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Homework</h1>

      {children.length > 1 && (
        <form method="get" className="mt-6 flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="studentId" className="text-xs font-medium text-zinc-500">
              Child
            </label>
            <select
              id="studentId"
              name="studentId"
              defaultValue={studentId}
              className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {children.map((child) => (
                <option key={child.studentId} value={child.studentId}>
                  {child.fullName}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
          >
            Switch Child
          </button>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {homework.map((item) => (
          <div key={item.id} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">{item.title}</h2>
              <span className="text-xs text-zinc-500">Due {item.dueDate}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-700">{item.description}</p>
          </div>
        ))}
        {homework.length === 0 && <p className="text-sm text-zinc-500">No homework assigned.</p>}
      </div>
    </main>
  );
}
