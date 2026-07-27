"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ConfirmActionButtonProps {
  label: string;
  confirmMessage: string;
  action: () => Promise<{ success: boolean; error?: { message: string } }>;
  variant?: "default" | "danger";
}

// Reusable Client Component — every status-change and role-removal button in this module needs
// the same shape: a confirmation dialog before firing a Server Action (destructive/significant
// actions shouldn't be one accidental click away), then a pending state and error display. This
// is the "Dialogs" category this step calls out for Client Components.
export function ConfirmActionButton({
  label,
  confirmMessage,
  action,
  variant = "default",
}: ConfirmActionButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsPending(true);
    setError(null);

    const result = await action();

    setIsPending(false);

    if (!result.success) {
      setError(result.error?.message ?? "Something went wrong.");
      return;
    }

    setIsConfirming(false);
    router.refresh();
  }

  const buttonClass =
    variant === "danger"
      ? "text-red-600 hover:underline"
      : "text-blue-600 hover:underline";

  if (!isConfirming) {
    return (
      <button type="button" onClick={() => setIsConfirming(true)} className={buttonClass}>
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm">
      <span className="text-zinc-700">{confirmMessage}</span>
      {error && <span className="text-red-600">{error}</span>}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isPending}
        className="font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        {isPending ? "Working…" : "Confirm"}
      </button>
      <button
        type="button"
        onClick={() => setIsConfirming(false)}
        disabled={isPending}
        className="text-zinc-500 hover:underline disabled:opacity-50"
      >
        Cancel
      </button>
    </span>
  );
}
