import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listStudents } from "@/modules/students/application/list-students.service";
import { listTeachers } from "@/modules/teachers/application/list-teachers.service";
import { listUsers } from "@/modules/users/application/list-users.service";
import { getMemberActivityReport } from "@/modules/library/application/get-fine-and-activity-reports.service";
import type { LibraryMemberTypeValue } from "@/modules/library/domain/book-issue.entity";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MemberActivityReportPage({ searchParams }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("library.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const memberType = (first(params.memberType) || "STUDENT") as LibraryMemberTypeValue;

  const [studentResult, teachers, userResult] = await Promise.all([
    listStudents({ page: 1, pageSize: 200 }, { tenantId: authContext.tenantId }),
    listTeachers({ tenantId: authContext.tenantId }),
    listUsers({ page: 1, pageSize: 200 }, { tenantId: authContext.tenantId }),
  ]);
  const students = studentResult.items.map((s) => ({ id: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` }));
  const teacherOptions = teachers.map((t) => ({ id: t.id, label: t.fullName }));
  const staff = userResult.items.map((u) => ({ id: u.id, label: u.fullName }));
  const options = memberType === "STUDENT" ? students : memberType === "TEACHER" ? teacherOptions : staff;

  const memberId = first(params.memberId) || options[0]?.id || "";
  const activity = memberId ? await getMemberActivityReport(authContext.tenantId, memberType, memberId) : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Member Activity</h1>
      <p className="mt-1 text-sm text-zinc-500">One member&apos;s full circulation history.</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="memberType" className="text-xs font-medium text-zinc-500">
            Member Type
          </label>
          <select id="memberType" name="memberType" defaultValue={memberType} className="w-36 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm">
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="STAFF">Staff</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="memberId" className="text-xs font-medium text-zinc-500">
            Member
          </label>
          <select id="memberId" name="memberId" defaultValue={memberId} className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm">
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400">
          Load
        </button>
      </form>

      {activity ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Total Issued</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{activity.totalIssued}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Currently Borrowed</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{activity.currentlyBorrowed}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Overdue</p>
            <p className="mt-1 text-2xl font-semibold text-red-700">{activity.overdueCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Lost</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">{activity.lostCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Damaged</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">{activity.damagedCount}</p>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">Select a member to load their activity.</p>
      )}
    </main>
  );
}
