"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkGenerateResultsAction, publishResultsAction } from "@/app/examinations/results/actions";

interface ResultActionsPanelProps {
  examId: string;
  status: string;
  canGenerate: boolean;
  canPublish: boolean;
}

// Result Generation and Publish are each one deliberate, explicit action — not a silent side
// effect of browsing here — matching Phase 7 Decision 9's "bulk result generation"/"bulk
// publish": one click applies to every student under this exam at once.
export function ResultActionsPanel({ examId, status, canGenerate, canPublish }: ResultActionsPanelProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setIsSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const result = await bulkGenerateResultsAction(examId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMessage(`Results generated for ${result.data.length} student(s).`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublish() {
    setIsSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const result = await publishResultsAction(examId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMessage("Results published.");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">{status}</span>
        {canGenerate && status === "MARKS_ENTRY_COMPLETED" && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Generating…" : "Generate Results"}
          </button>
        )}
        {canPublish && status === "RESULT_GENERATED" && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Publishing…" : "Publish Results"}
          </button>
        )}
      </div>
      {message && <p className="text-sm text-blue-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
