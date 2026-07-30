import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listHostels } from "@/modules/hostel/application/list-hostels.service";
import { getBedOccupancyReport } from "@/modules/hostel/application/get-bed-occupancy-report.service";

interface BedOccupancyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BedOccupancyReportPage({ searchParams }: BedOccupancyPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const hostels = await listHostels({ tenantId: authContext.tenantId }, { isActive: true });
  const hostelId = first(params.hostelId) || hostels[0]?.id || "";

  const rows = hostelId ? await getBedOccupancyReport(authContext.tenantId, hostelId) : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Bed Occupancy Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Every bed&apos;s status and occupant.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="hostelId" className="text-xs font-medium text-zinc-500">
            Hostel
          </label>
          <select
            id="hostelId"
            name="hostelId"
            defaultValue={hostelId}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {hostels.map((hostel) => (
              <option key={hostel.id} value={hostel.id}>
                {hostel.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Load
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Room</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Bed</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Occupant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => (
              <tr key={row.bedId}>
                <td className="px-4 py-2 font-medium text-zinc-900">{row.roomNumber}</td>
                <td className="px-4 py-2 text-zinc-700">{row.bedNumber}</td>
                <td className="px-4 py-2 text-zinc-700">{row.status}</td>
                <td className="px-4 py-2 text-zinc-700">{row.occupantName ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No beds for this hostel.</p>}
      </div>
    </main>
  );
}
