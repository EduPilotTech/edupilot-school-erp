import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listStudents } from "@/modules/students/application/list-students.service";
import { listOutstandingInvoicesForStudent } from "@/modules/fees/application/list-invoices.service";
import { listStudentPayments } from "@/modules/fees/application/get-payment.service";
import { PaymentCollectionForm } from "@/components/features/fees/PaymentCollectionForm";
import { PaymentHistoryTable } from "@/components/features/fees/PaymentHistoryTable";

interface CollectPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CollectPaymentPage({ searchParams }: CollectPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("fee.payment.collect");
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

  const outstandingInvoices = studentId
    ? await listOutstandingInvoicesForStudent(authContext.tenantId, studentId)
    : [];
  const payments =
    studentId && academicSessionId ? await listStudentPayments(authContext.tenantId, studentId, academicSessionId) : [];
  const selectedStudent = studentResult.items.find((student) => student.id === studentId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Collect Payment</h1>
      <p className="mt-1 text-sm text-zinc-500">Search a student, select outstanding invoices, and record a payment.</p>

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
                href={`/fees/collect?q=${encodeURIComponent(search)}&studentId=${student.id}`}
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
            <PaymentCollectionForm
              studentId={studentId}
              academicSessionId={academicSessionId}
              outstandingInvoices={outstandingInvoices}
            />
          </div>

          <h2 className="mt-8 text-base font-semibold text-zinc-900">Payment History</h2>
          <div className="mt-3">
            <PaymentHistoryTable payments={payments} canReverse={can(authorization, "fee.payment.reverse")} />
          </div>
        </div>
      )}
    </main>
  );
}
