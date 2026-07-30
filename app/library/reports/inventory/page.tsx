import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listLibraries } from "@/modules/library/application/library.service";
import { getBookInventoryReport } from "@/modules/library/application/get-book-inventory-report.service";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function InventoryReportPage({ searchParams }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("library.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const libraries = await listLibraries({ tenantId: authContext.tenantId }, { isActive: true });
  const libraryId = first(params.libraryId) || libraries[0]?.id || "";
  const rows = libraryId ? await getBookInventoryReport(authContext.tenantId, libraryId) : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Inventory Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Copy counts per title, by status.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="libraryId" className="text-xs font-medium text-zinc-500">
            Library
          </label>
          <select id="libraryId" name="libraryId" defaultValue={libraryId} className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm">
            {libraries.map((library) => (
              <option key={library.id} value={library.id}>
                {library.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400">
          Load
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Title</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Total</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Available</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Issued</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Reserved</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Lost</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Damaged</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => (
              <tr key={row.bookId}>
                <td className="px-4 py-2 font-medium text-zinc-900">{row.title}</td>
                <td className="px-4 py-2 text-zinc-700">{row.totalCopies}</td>
                <td className="px-4 py-2 text-emerald-700">{row.available}</td>
                <td className="px-4 py-2 text-zinc-700">{row.issued}</td>
                <td className="px-4 py-2 text-zinc-700">{row.reserved}</td>
                <td className="px-4 py-2 text-amber-700">{row.lost}</td>
                <td className="px-4 py-2 text-red-700">{row.damaged}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No books in this library.</p>}
      </div>
    </main>
  );
}
