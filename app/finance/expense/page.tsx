import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listExpense } from "@/modules/finance/application/expense.service";
import { listExpenseCategories } from "@/modules/finance/application/expense-category.service";
import { listFinanceAccounts } from "@/modules/finance/application/finance-account.service";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { ExpenseListTable, type ExpenseRowDisplay } from "@/components/features/finance/ExpenseListTable";
import { CsvExportButton } from "@/components/features/finance/CsvExportButton";
import { PaginationLinks } from "./_components/pagination-links";

interface ExpenseListPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// The symmetric counterpart of app/finance/income/page.tsx.
export default async function ExpenseListPage({ searchParams }: ExpenseListPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("finance.expense.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const academicSessionId = first(params.academicSessionId) || undefined;
  const expenseCategoryId = first(params.expenseCategoryId) || undefined;
  const fromDateRaw = first(params.fromDate) || undefined;
  const toDateRaw = first(params.toDate) || undefined;
  const search = first(params.search) || undefined;
  const page = Number(first(params.page)) || 1;

  const [{ items, total, pageSize }, categories, accounts, sessions] = await Promise.all([
    listExpense(authContext.tenantId, {
      page,
      pageSize: 20,
      academicSessionId,
      expenseCategoryId,
      fromDate: fromDateRaw ? new Date(fromDateRaw) : undefined,
      toDate: toDateRaw ? new Date(toDateRaw) : undefined,
      search,
    }),
    listExpenseCategories({ tenantId: authContext.tenantId }),
    listFinanceAccounts(authContext.tenantId, authContext.schoolId),
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
  ]);

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  const accountNameById = new Map(accounts.map((account) => [account.id, account.name]));

  const rows: ExpenseRowDisplay[] = items.map((expense) => ({
    ...expense,
    categoryName: categoryNameById.get(expense.expenseCategoryId) ?? "",
    accountName: accountNameById.get(expense.financeAccountId) ?? "",
  }));

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const csvHeaders = ["Date", "Category", "Account", "Amount", "Vendor", "Payment Mode", "Reference No", "Description"];
  const csvRows = rows.map((row) => [
    row.date,
    row.categoryName,
    row.accountName,
    row.amount,
    row.vendor ?? "",
    row.paymentMode,
    row.referenceNo ?? "",
    row.description ?? "",
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/finance" className="text-sm text-blue-600 hover:underline">
        ← Finance & Accounts
      </Link>

      <div className="mt-2 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Expense</h1>
          <p className="mt-1 text-sm text-zinc-500">Every expense entry recorded against a finance account.</p>
        </div>
        <div className="flex items-center gap-3">
          <CsvExportButton fileName="expense" headers={csvHeaders} rows={csvRows} />
          <Link
            href="/finance/expense/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Add Expense
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
            placeholder="Vendor, reference no, or description"
            className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
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
          <label htmlFor="expenseCategoryId" className="text-xs font-medium text-zinc-500">
            Expense Category
          </label>
          <select
            id="expenseCategoryId"
            name="expenseCategoryId"
            defaultValue={expenseCategoryId ?? ""}
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
        <ExpenseListTable items={rows} canManage />
      </div>

      <PaginationLinks page={page} totalPages={totalPages} searchParams={params} />
    </main>
  );
}
