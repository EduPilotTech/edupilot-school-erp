import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMyLibrary } from "@/modules/parents/application/get-my-library.service";

interface PageProps {
  params: Promise<{ studentId: string }>;
}

// Parent Portal Integration (Phase 12 requirement 8) — issued books, history, due date, fine,
// overdue, and reservation status, reusing the same guardian-access authorization every other
// parent-facing page in this app uses.
export default async function ParentStudentLibraryPage({ params }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("parent.library.view");
  const { studentId } = await params;

  const library = await getMyLibrary(studentId, {
    tenantId: authContext.tenantId,
    userProfileId: authContext.userId,
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Library</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-500">Currently Issued</h2>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">{library.currentlyIssued.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-500">Overdue</h2>
          <p className="mt-1 text-3xl font-semibold text-red-700">{library.overdueCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-500">Fine Due</h2>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">₹{library.totalFineDue.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold text-zinc-900">Currently Issued Books</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Book</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Issue Date</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Due Date</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {library.currentlyIssued.map((item) => (
                <tr key={item.bookIssueId}>
                  <td className="px-4 py-2 font-medium text-zinc-900">{item.bookTitle}</td>
                  <td className="px-4 py-2 text-zinc-700">{item.issueDate}</td>
                  <td className="px-4 py-2 text-zinc-700">{item.dueDate}</td>
                  <td className={`px-4 py-2 ${item.isOverdue ? "text-red-700" : "text-zinc-700"}`}>
                    {item.isOverdue ? "Overdue" : "On time"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {library.currentlyIssued.length === 0 && <p className="p-4 text-sm text-zinc-500">No books currently issued.</p>}
        </div>
      </div>

      {library.reservations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-base font-semibold text-zinc-900">Reservations</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {library.reservations.map((reservation) => (
              <li key={reservation.reservationId} className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
                <span className="font-medium text-zinc-900">{reservation.bookTitle}</span> — {reservation.status} (reserved{" "}
                {reservation.reservationDate})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-base font-semibold text-zinc-900">History</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Book</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Issue Date</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Return Date</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {library.history.map((item) => (
                <tr key={item.bookIssueId}>
                  <td className="px-4 py-2 font-medium text-zinc-900">{item.bookTitle}</td>
                  <td className="px-4 py-2 text-zinc-700">{item.issueDate}</td>
                  <td className="px-4 py-2 text-zinc-700">{item.returnDate ?? "—"}</td>
                  <td className="px-4 py-2 text-zinc-700">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {library.history.length === 0 && <p className="p-4 text-sm text-zinc-500">No past library activity.</p>}
        </div>
      </div>
    </main>
  );
}
