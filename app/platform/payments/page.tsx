import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getCollectionReport } from "@/modules/billing/application/get-collection-report.service";
import { getMonthlyRevenueReport } from "@/modules/billing/application/get-monthly-revenue-report.service";

interface PlatformPaymentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Parses a "YYYY-MM-DD" query param into a UTC Date, falling back to the given default when the
// value is missing or malformed — mirrors app/students/page.tsx's own GET-form filter-bar
// pattern ("no client JS needed", first() helper for string | string[] | undefined params).
function parseDateOnly(value: string | undefined, fallback: Date): Date {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function endOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function parseYear(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2000 && parsed <= 2100 ? parsed : fallback;
}

// Platform-wide collections (getCollectionReport, date-range) and year-on-year revenue
// (getMonthlyRevenueReport). Two independent GET-form filters on one page — each form carries the
// other filter's current value as a hidden input, so submitting one never resets the other.
export default async function PlatformPaymentsDashboardPage({ searchParams }: PlatformPaymentsPageProps) {
  await requireAuthContext();
  await requirePermission("platform.billing.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const now = new Date();
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  const fromDate = parseDateOnly(first(params.from), defaultFrom);
  const toDate = endOfDayUtc(parseDateOnly(first(params.to), defaultTo));
  const year = parseYear(first(params.year), now.getUTCFullYear());

  const fromValue = toDateOnlyString(fromDate);
  const toValue = toDateOnlyString(toDate);

  const [collectionReport, monthlyRevenueReport] = await Promise.all([
    getCollectionReport(fromDate, toDate),
    getMonthlyRevenueReport(year),
  ]);

  const maxMonthlyRevenue = Math.max(1, ...monthlyRevenueReport.months.map((m) => m.revenue));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/platform" className="text-sm text-blue-600 hover:underline">
        ← Platform Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Payment Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">Collections by date range and gateway provider, platform-wide.</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-xs font-medium text-zinc-500">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={fromValue}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-xs font-medium text-zinc-500">
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={toValue}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <input type="hidden" name="year" value={year} />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Apply
        </button>
      </form>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Total Collected</p>
          <p className="mt-2 text-3xl font-semibold text-green-700">₹{collectionReport.totalCollected.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Payment Count</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{collectionReport.paymentCount}</p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">By Gateway Provider</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Gateway Provider</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Amount</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {collectionReport.byGatewayProvider.map((row) => (
                <tr key={row.gatewayProvider}>
                  <td className="px-4 py-2 font-medium text-zinc-900">{row.gatewayProvider}</td>
                  <td className="px-4 py-2 text-zinc-700">₹{row.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 text-zinc-700">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {collectionReport.byGatewayProvider.length === 0 && (
            <p className="p-4 text-sm text-zinc-500">No payments collected in this date range.</p>
          )}
        </div>
      </div>

      <form method="get" className="mt-10 flex flex-wrap items-end gap-3">
        <input type="hidden" name="from" value={fromValue} />
        <input type="hidden" name="to" value={toValue} />
        <div className="flex flex-col gap-1">
          <label htmlFor="year" className="text-xs font-medium text-zinc-500">
            Year
          </label>
          <input
            id="year"
            name="year"
            type="number"
            defaultValue={year}
            className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Apply
        </button>
      </form>

      <div className="mt-4">
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">Monthly Revenue — {year}</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Month</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Revenue</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Payments</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {monthlyRevenueReport.months.map((month) => (
                <tr key={month.month}>
                  <td className="px-4 py-2 font-medium text-zinc-900">{MONTH_NAMES[month.month - 1]}</td>
                  <td className="px-4 py-2 text-zinc-700">₹{month.revenue.toFixed(2)}</td>
                  <td className="px-4 py-2 text-zinc-700">{month.paymentCount}</td>
                  <td className="px-4 py-2">
                    <div className="h-2 rounded-full bg-blue-100">
                      <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: `${Math.round((month.revenue / maxMonthlyRevenue) * 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
