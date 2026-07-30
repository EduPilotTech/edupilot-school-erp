import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getHostelVisitorReport } from "@/modules/hostel/application/get-hostel-visitor-report.service";

interface VisitorReportPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIsoDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export default async function HostelVisitorReportPage({ searchParams }: VisitorReportPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const startDate = first(params.startDate) ?? daysAgoIsoDate(7);
  const endDate = first(params.endDate) ?? todayIsoDate();

  const rows = await getHostelVisitorReport(authContext.tenantId, new Date(startDate), new Date(`${endDate}T23:59:59.999Z`));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Visitor Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Hostel visitor log for a date range.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="startDate" className="text-xs font-medium text-zinc-500">
            From
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={startDate}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="endDate" className="text-xs font-medium text-zinc-500">
            To
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={endDate}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Filter
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Student</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Visitor</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Relation</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Purpose</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Entry</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Exit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{row.studentName}</td>
                <td className="px-4 py-2 text-zinc-700">{row.visitorName}</td>
                <td className="px-4 py-2 text-zinc-700">{row.relation}</td>
                <td className="px-4 py-2 text-zinc-700">{row.purpose}</td>
                <td className="px-4 py-2 text-zinc-700">{new Date(row.entryTime).toLocaleString()}</td>
                <td className="px-4 py-2 text-zinc-700">{row.exitTime ? new Date(row.exitTime).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No visitors in this range.</p>}
      </div>
    </main>
  );
}
