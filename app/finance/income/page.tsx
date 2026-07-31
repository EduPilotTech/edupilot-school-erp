import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listIncome } from "@/modules/finance/application/income.service";
import { listIncomeCategories } from "@/modules/finance/application/income-category.service";
import { listFinanceAccounts } from "@/modules/finance/application/finance-account.service";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { IncomeListTable, type IncomeRowDisplay } from "@/components/features/finance/IncomeListTable";
import { CsvExportButton } from "@/components/features/finance/CsvExportButton";
import { PaginationLinks } from "./_components/pagination-links";

interface IncomeListPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// List + GET-form filter bar, mirroring app/students/page.tsx's exact pattern: filters travel as
// query params (no client JS needed to filter/paginate), the read service is called directly (no
// Server Action — this is a pure read).
export default async function IncomeListPage({ searchParams }: IncomeListPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("finance.income.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const academicSessionId = first(params.academicSessionId) || undefined;
  const incomeCategoryId = first(params.incomeCategoryId) || undefined;
  const fromDateRaw = first(params.fromDate) || undefined;
  const toDateRaw = first(params.toDate) || undefined;
  const search = first(params.search) || undefined;
  const page = Number(first(params.page)) || 1;

  const [{ items, total, pageSize }, categories, accounts, sessions] = await Promise.all([
    listIncome(authContext.tenantId, {
      page,
      pageSize: 20,
      academicSessionId,
      incomeCategoryId,
      fromDate: fromDateRaw ? new Date(fromDateRaw) : undefined,
      toDate: toDateRaw ? new Date(toDateRaw) : undefined,
      search,
    }),
    listIncomeCategories({ tenantId: authContext.tenantId }),
    listFinanceAccounts(authContext.tenantId, authContext.schoolId),
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
  ]);

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  const accountNameById = new Map(accounts.map((account) => [account.id, account.name]));

  const rows: IncomeRowDisplay[] = items.map((income) => ({
    ...income,
    categoryName: categoryNameById.get(income.incomeCategoryId) ?? "",
    accountName: accountNameById.get(income.financeAccountId) ?? "",
  }));

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const csvHeaders = ["Date", "Category", "Account", "Amount", "Reference No", "Description"];
  const csvRows = rows.map((row) => [row.date, row.categoryName, row.accountName, row.amount, row.referenceNo ?? "", row.description ?? ""]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/finance" className="text-sm text-blue-600 hover:underline">
        ← Finance & Accounts
      </Link>

      <div className="mt-2 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Income</h1>
          <p className="mt-1 text-sm text-zinc-500">Every income entry recorded against a finance account.</p>
        </div>
        <div className="flex items-center gap-3">
          <CsvExportButton fileName="income" headers={csvHeaders} rows={csvRows} />
          <Link
            href="/finance/income/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Add Income
          </Link>
        </div>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="search" className="text-xs font-medium text-zinc-500">
            Search
          </label>
          <input
            id="search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Reference no or description"
            className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="academicSessionId" className="text-xs font-medium text-zinc-500">
            Academic Session
          </label>
          <select
            id="academicSessionId"
            name="academicSessionId"
            defaultValue={academicSessionId ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All sessions</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="incomeCategoryId" className="text-xs font-medium text-zinc-500">
            Income Category
          </label>
          <select
            id="incomeCategoryId"
            name="incomeCategoryId"
            defaultValue={incomeCategoryId ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="fromDate" className="text-xs font-medium text-zinc-500">
            From Date
          </label>
          <input
            id="fromDate"
            name="fromDate"
            type="date"
            defaultValue={fromDateRaw ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="toDate" className="text-xs font-medium text-zinc-500">
            To Date
          </label>
          <input
            id="toDate"
            name="toDate"
            type="date"
            defaultValue={toDateRaw ?? ""}
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

      <div className="mt-6">
        <IncomeListTable items={rows} canManage />
      </div>

      <PaginationLinks page={page} totalPages={totalPages} searchParams={params} />
    </main>
  );
}
