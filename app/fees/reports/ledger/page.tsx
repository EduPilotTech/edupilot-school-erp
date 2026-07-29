import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listStudents } from "@/modules/students/application/list-students.service";
import { getStudentFeeLedger } from "@/modules/fees/application/get-student-fee-ledger.service";

interface LedgerPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Student Fee Ledger (requirement 17) — a direct, append-only history (Decision 11): every
// invoice, payment, concession, fine, and reversal in chronological order with a running balance.
export default async function LedgerPage({ searchParams }: LedgerPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("fee.ledger.view");

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

  const entries =
    studentId && academicSessionId ? await getStudentFeeLedger(authContext.tenantId, studentId, academicSessionId) : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Student Fee Ledger</h1>
      <p className="mt-1 text-sm text-zinc-500">Running balance per student — every entry is append-only.</p>

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
                href={`/fees/reports/ledger?q=${encodeURIComponent(search)}&studentId=${student.id}`}
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
          <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Type</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Description</th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-500">Debit</th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-500">Credit</th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-500">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-2 text-zinc-700">{new Date(entry.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-zinc-700">{entry.entryType}</td>
                    <td className="px-4 py-2 text-zinc-700">{entry.description}</td>
                    <td className="px-4 py-2 text-right text-zinc-700">
                      {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right text-zinc-700">
                      {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-zinc-900">₹{entry.balanceAfter.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length === 0 && <p className="p-4 text-sm text-zinc-500">No ledger entries yet.</p>}
          </div>
        </div>
      )}
    </main>
  );
}
