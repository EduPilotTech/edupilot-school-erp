"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { recordIncomeAction, updateIncomeAction } from "@/app/finance/actions";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { IncomeDTO } from "@/modules/finance/application/dto/income.dto";
import type { IncomeCategoryDTO } from "@/modules/finance/application/dto/finance-category.dto";
import type { FinanceAccountDTO } from "@/modules/finance/application/dto/finance-account.dto";

interface SessionOption {
  id: string;
  sessionName: string;
}

interface CollectorOption {
  id: string;
  fullName: string;
  email: string | null;
}

interface IncomeFormProps {
  sessions: SessionOption[];
  categories: IncomeCategoryDTO[];
  accounts: FinanceAccountDTO[];
  collectors: CollectorOption[];
  income?: IncomeDTO;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Create + Edit Income, one form component (mode inferred from whether `income` is supplied) —
// mirrors components/features/hr/EmployeeCreateForm.tsx's Card/FormField/Input/Select shape and
// plain-useState-fields precedent, matching createIncomeSchema/updateIncomeSchema's exact field
// set (see modules/finance/application/dto/income.dto.ts).
export function IncomeForm({ sessions, categories, accounts, collectors, income }: IncomeFormProps) {
  const router = useRouter();
  const isEdit = Boolean(income);

  const [academicSessionId, setAcademicSessionId] = useState(income?.academicSessionId ?? sessions[0]?.id ?? "");
  const [incomeCategoryId, setIncomeCategoryId] = useState(income?.incomeCategoryId ?? "");
  const [financeAccountId, setFinanceAccountId] = useState(income?.financeAccountId ?? "");
  const [amount, setAmount] = useState(income ? String(income.amount) : "");
  const [date, setDate] = useState(income?.date ?? todayIsoDate());
  const [description, setDescription] = useState(income?.description ?? "");
  const [referenceNo, setReferenceNo] = useState(income?.referenceNo ?? "");
  const [collectedBy, setCollectedBy] = useState(income?.collectedBy ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = academicSessionId && incomeCategoryId && financeAccountId && amount && date;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        academicSessionId,
        incomeCategoryId,
        financeAccountId,
        amount: Number(amount),
        date,
        description: description || undefined,
        referenceNo: referenceNo || undefined,
        collectedBy: collectedBy || undefined,
      };

      const result = isEdit ? await updateIncomeAction(income!.id, payload) : await recordIncomeAction(payload);

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      router.push("/finance/income");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card title="Income Entry" description="Which academic session, category, and finance account this income belongs to.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Academic Session" htmlFor="income-session" required>
            <Select
              id="income-session"
              value={academicSessionId}
              onChange={(e) => setAcademicSessionId(e.target.value)}
              placeholder="Select academic session"
              options={sessions.map((session) => ({ value: session.id, label: session.sessionName }))}
            />
          </FormField>

          <FormField label="Income Category" htmlFor="income-category" required>
            <Select
              id="income-category"
              value={incomeCategoryId}
              onChange={(e) => setIncomeCategoryId(e.target.value)}
              placeholder="Select income category"
              options={categories.map((category) => ({ value: category.id, label: category.name }))}
            />
          </FormField>

          <FormField label="Finance Account" htmlFor="income-account" required>
            <Select
              id="income-account"
              value={financeAccountId}
              onChange={(e) => setFinanceAccountId(e.target.value)}
              placeholder="Select finance account"
              options={accounts.map((account) => ({ value: account.id, label: `${account.name} (${account.accountType})` }))}
            />
          </FormField>

          <FormField label="Amount (₹)" htmlFor="income-amount" required>
            <Input
              id="income-amount"
              type="number"
              min={0.01}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </FormField>

          <FormField label="Date" htmlFor="income-date" required>
            <Input id="income-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>

          <FormField label="Reference No" htmlFor="income-reference-no" hint="Optional">
            <Input
              id="income-reference-no"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="Receipt / cheque / transaction number"
            />
          </FormField>

          <FormField label="Collected By" htmlFor="income-collected-by" hint="Optional">
            <Select
              id="income-collected-by"
              value={collectedBy}
              onChange={(e) => setCollectedBy(e.target.value)}
              placeholder="Not recorded"
              options={collectors.map((collector) => ({
                value: collector.id,
                label: collector.email ? `${collector.fullName} (${collector.email})` : collector.fullName,
              }))}
            />
          </FormField>
        </div>

        <div className="mt-4">
          <FormField label="Description" htmlFor="income-description" hint="Optional">
            <Textarea id="income-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
        </div>
      </Card>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-200 pt-6">
        <button
          type="button"
          onClick={() => router.push("/finance/income")}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Record Income"}
        </button>
      </div>
    </form>
  );
}
