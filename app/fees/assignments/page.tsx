import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listStudents } from "@/modules/students/application/list-students.service";
import { listFeeStructures } from "@/modules/fees/application/list-fee-structures.service";
import { listInstallmentPlans } from "@/modules/fees/application/list-installment-plans.service";
import { getStudentFeeAssignment } from "@/modules/fees/application/assign-student-fee.service";
import { StudentFeeAssignmentTable } from "@/components/features/fees/StudentFeeAssignmentTable";

interface AssignmentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StudentFeeAssignmentsPage({ searchParams }: AssignmentsPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("feeassignment.view");
  const authorization = await getAuthorizationContext();

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions[0]?.id || "";
  const search = first(params.q) ?? "";

  const structures = academicSessionId ? await listFeeStructures(authContext.tenantId, academicSessionId) : [];
  const installmentPlans = academicSessionId
    ? await listInstallmentPlans(authContext.tenantId, academicSessionId)
    : [];

  const studentResult = search
    ? await listStudents({ search, page: 1, pageSize: 20 }, { tenantId: authContext.tenantId })
    : { items: [], total: 0, page: 1, pageSize: 20 };

  const assignments = academicSessionId
    ? await Promise.all(
        studentResult.items.map((student) => getStudentFeeAssignment(authContext.tenantId, student.id, academicSessionId))
      )
    : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Student Fee Assignment</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Assign a fee structure (and optional installment plan) to a student for this session.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="academicSessionId" className="text-xs font-medium text-zinc-500">
            Academic Session
          </label>
          <select
            id="academicSessionId"
            name="academicSessionId"
            defaultValue={academicSessionId}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionName}
              </option>
            ))}
          </select>
        </div>
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

      <div className="mt-8">
        <StudentFeeAssignmentTable
          academicSessionId={academicSessionId}
          students={studentResult.items.map((student, index) => ({
            id: student.id,
            admissionNumber: student.admissionNumber,
            fullName: `${student.firstName} ${student.lastName}`,
            currentAssignment: assignments[index] ?? null,
          }))}
          structures={structures}
          installmentPlans={installmentPlans}
          canManage={can(authorization, "feeassignment.manage")}
        />
      </div>
    </main>
  );
}
