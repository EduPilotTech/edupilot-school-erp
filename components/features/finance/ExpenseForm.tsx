"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { recordExpenseAction, updateExpenseAction } from "@/app/finance/actions";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { ExpenseDTO } from "@/modules/finance/application/dto/expense.dto";
import type { ExpenseCategoryDTO } from "@/modules/finance/application/dto/finance-category.dto";
import type { FinanceAccountDTO } from "@/modules/finance/application/dto/finance-account.dto";
import type { FinancePaymentModeValue } from "@/modules/finance/domain/finance-payment-mode";

interface SessionOption {
  id: string;
  sessionName: string;
}

interface ExpenseFormProps {
  sessions: SessionOption[];
  categories: ExpenseCategoryDTO[];
  accounts: FinanceAccountDTO[];
  expense?: ExpenseDTO;
}

const PAYMENT_MODES: FinancePaymentModeValue[] = ["CASH", "BANK_TRANSFER", "CHEQUE", "UPI", "CARD", "OTHER"];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Create + Edit Expense — the symmetric counterpart of IncomeForm, with Vendor (text) and Payment
// Mode (dropdown) in place of Income's Collected By, exactly matching
// createExpenseSchema/updateExpenseSchema's field set.
export function ExpenseForm({ sessions, categories, accounts, expense }: ExpenseFormProps) {
  const router = useRouter();
  const isEdit = Boolean(expense);

  const [academicSessionId, setAcademicSessionId] = useState(expense?.academicSessionId ?? sessions[0]?.id ?? "");
  const [expenseCategoryId, setExpenseCategoryId] = useState(expense?.expenseCategoryId ?? "");
  const [financeAccountId, setFinanceAccountId] = useState(expense?.financeAccountId ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [date, setDate] = useState(expense?.date ?? todayIsoDate());
  const [vendor, setVendor] = useState(expense?.vendor ?? "");
  const [description, setDescription] = useState(expense?.description ?? "");
  const [paymentMode, setPaymentMode] = useState<FinancePaymentModeValue>(expense?.paymentMode ?? "CASH");
  const [referenceNo, setReferenceNo] = useState(expense?.referenceNo ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = academicSessionId && expenseCategoryId && financeAccountId && amount && date && paymentMode;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        academicSessionId,
        expenseCategoryId,
        financeAccountId,
        amount: Number(amount),
        date,
        vendor: vendor || undefined,
        description: description || undefined,
        paymentMode,
        referenceNo: referenceNo || undefined,
      };

      const result = isEdit ? await updateExpenseAction(expense!.id, payload) : await recordExpenseAction(payload);

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      router.push("/finance/expense");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card title="Expense Entry" description="Which academic session, category, and finance account this expense belongs to.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Academic Session" htmlFor="expense-session" required>
            <Select
              id="expense-session"
              value={academicSessionId}
              onChange={(e) => setAcademicSessionId(e.target.value)}
              placeholder="Select academic session"
              options={sessions.map((session) => ({ value: session.id, label: session.sessionName }))}
            />
          </FormField>

          <FormField label="Expense Category" htmlFor="expense-category" required>
            <Select
              id="expense-category"
              value={expenseCategoryId}
              onChange={(e) => setExpenseCategoryId(e.target.value)}
              placeholder="Select expense category"
              options={categories.map((category) => ({ value: category.id, label: category.name }))}
            />
          </FormField>

          <FormField label="Finance Account" htmlFor="expense-account" required>
            <Select
              id="expense-account"
              value={financeAccountId}
              onChange={(e) => setFinanceAccountId(e.target.value)}
              placeholder="Select finance account"
              options={accounts.map((account) => ({ value: account.id, label: `${account.name} (${account.accountType})` }))}
            />
          </FormField>

          <FormField label="Amount (₹)" htmlFor="expense-amount" required>
            <Input
              id="expense-amount"
              type="number"
              min={0.01}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </FormField>

          <FormField label="Date" htmlFor="expense-date" required>
            <Input id="expense-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>

          <FormField label="Payment Mode" htmlFor="expense-payment-mode" required>
            <Select
              id="expense-payment-mode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as FinancePaymentModeValue)}
              options={PAYMENT_MODES.map((mode) => ({ value: mode, label: mode.replace("_", " ") }))}
            />
          </FormField>

          <FormField label="Vendor" htmlFor="expense-vendor" hint="Optional">
            <Input id="expense-vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Payee / supplier name" />
          </FormField>

          <FormField label="Reference No" htmlFor="expense-reference-no" hint="Optional">
            <Input
              id="expense-reference-no"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="Invoice / cheque / transaction number"
            />
          </FormField>
        </div>

        <div className="mt-4">
          <FormField label="Description" htmlFor="expense-description" hint="Optional">
            <Textarea id="expense-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
        </div>
      </Card>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-200 pt-6">
        <button
          type="button"
          onClick={() => router.push("/finance/expense")}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Record Expense"}
        </button>
      </div>
    </form>
  );
}
