"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateExamStatusAction } from "@/app/examinations/actions";
import { getNextStatus } from "@/modules/examinations/application/exam-lifecycle.helpers";
import type { ExamStatusValue } from "@/modules/examinations/domain/exam.entity";

interface ExamStatusControlProps {
  examId: string;
  status: ExamStatusValue;
  canManage: boolean;
}

// MARKS_ENTRY_COMPLETED -> RESULT_GENERATED and RESULT_GENERATED -> RESULT_PUBLISHED are
// deliberately NOT plain status flips here — bulk-generate-results.service.ts and
// publish-results.service.ts each do real work (generating/locking results) before moving the
// status, so those two transitions route to the Results page instead of a bare button.
const ROUTED_TRANSITIONS = new Set<ExamStatusValue>(["RESULT_GENERATED", "RESULT_PUBLISHED"]);

export function ExamStatusControl({ examId, status, canManage }: ExamStatusControlProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatus = getNextStatus(status);

  async function handleAdvance() {
    if (!nextStatus) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await updateExamStatusAction(examId, { status: nextStatus });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">{status}</span>
        {canManage && nextStatus && ROUTED_TRANSITIONS.has(nextStatus) && (
          <Link
            href="/examinations/results"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
          >
            Go to Results to {nextStatus === "RESULT_GENERATED" ? "Generate" : "Publish"}
          </Link>
        )}
        {canManage && nextStatus && !ROUTED_TRANSITIONS.has(nextStatus) && (
          <button
            type="button"
            onClick={handleAdvance}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Advancing…" : `Advance to ${nextStatus}`}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
