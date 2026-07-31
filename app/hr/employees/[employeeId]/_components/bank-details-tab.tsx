"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertEmployeeBankDetailAction } from "@/app/hr/actions";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import type { EmployeeBankDetailDTO } from "@/modules/hr/application/dto/employee-bank-detail.dto";

interface BankDetailsTabProps {
  employeeId: string;
  bankDetail: EmployeeBankDetailDTO | null;
  canManage: boolean;
}

// Masks all but the last 4 digits — this is sensitive PII (docs/SECURITY_GUIDELINES.md's general
// PII-display caution) and there is no shared masking helper anywhere in this codebase yet, so a
// small local function is written here rather than inventing a new shared module out of scope.
function maskAccountNumber(accountNumber: string): string {
  const visible = accountNumber.slice(-4);
  return `${"•".repeat(Math.max(accountNumber.length - 4, 4))}${visible}`;
}

export function BankDetailsTab({ employeeId, bankDetail, canManage }: BankDetailsTabProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(bankDetail === null);
  const [accountHolderName, setAccountHolderName] = useState(bankDetail?.accountHolderName ?? "");
  const [accountNumber, setAccountNumber] = useState(bankDetail?.accountNumber ?? "");
  const [bankName, setBankName] = useState(bankDetail?.bankName ?? "");
  const [branchName, setBranchName] = useState(bankDetail?.branchName ?? "");
  const [ifscCode, setIfscCode] = useState(bankDetail?.ifscCode ?? "");
  const [accountType, setAccountType] = useState(bankDetail?.accountType ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await upsertEmployeeBankDetailAction({
        employeeId,
        accountHolderName,
        accountNumber,
        bankName,
        branchName: branchName || undefined,
        ifscCode,
        accountType: accountType || undefined,
      });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      setIsEditing(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isEditing && bankDetail) {
    return (
      <Card title="Bank Details">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-zinc-500">Account Holder</dt>
            <dd className="text-zinc-900">{bankDetail.accountHolderName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Account Number</dt>
            <dd className="font-mono text-zinc-900">{maskAccountNumber(bankDetail.accountNumber)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Bank</dt>
            <dd className="text-zinc-900">{bankDetail.bankName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Branch</dt>
            <dd className="text-zinc-900">{bankDetail.branchName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">IFSC Code</dt>
            <dd className="text-zinc-900">{bankDetail.ifscCode}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Account Type</dt>
            <dd className="text-zinc-900">{bankDetail.accountType ?? "—"}</dd>
          </div>
        </dl>

        {canManage && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
            >
              Edit
            </button>
          </div>
        )}
      </Card>
    );
  }

  if (!canManage) {
    return (
      <Card title="Bank Details">
        <p className="text-sm text-zinc-500">No bank details on file.</p>
      </Card>
    );
  }

  return (
    <Card title={bankDetail ? "Edit Bank Details" : "Add Bank Details"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Account Holder Name" htmlFor="bank-account-holder" required>
            <Input
              id="bank-account-holder"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
            />
          </FormField>
          <FormField label="Account Number" htmlFor="bank-account-number" required>
            <Input id="bank-account-number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          </FormField>
          <FormField label="Bank Name" htmlFor="bank-name" required>
            <Input id="bank-name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </FormField>
          <FormField label="Branch Name" htmlFor="bank-branch-name" hint="Optional">
            <Input id="bank-branch-name" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
          </FormField>
          <FormField label="IFSC Code" htmlFor="bank-ifsc-code" required>
            <Input
              id="bank-ifsc-code"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
              placeholder="SBIN0001234"
            />
          </FormField>
          <FormField label="Account Type" htmlFor="bank-account-type" hint="Optional">
            <Input id="bank-account-type" value={accountType} onChange={(e) => setAccountType(e.target.value)} placeholder="Savings" />
          </FormField>
        </div>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-3">
          {bankDetail && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !accountHolderName || !accountNumber || !bankName || !ifscCode}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Card>
  );
}
