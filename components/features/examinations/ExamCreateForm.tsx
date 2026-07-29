"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createExamAction } from "@/app/examinations/actions";

interface ExamCreateFormProps {
  academicSessionId: string;
  examTypeOptions: { id: string; name: string }[];
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ExamCreateForm({ academicSessionId, examTypeOptions }: ExamCreateFormProps) {
  const router = useRouter();
  const [examTypeId, setExamTypeId] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [endDate, setEndDate] = useState(todayIsoDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createExamAction({ academicSessionId, examTypeId, name, startDate, endDate });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setName("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="exam-type" className="text-xs font-medium text-zinc-500">
            Exam Type
          </label>
          <select
            id="exam-type"
            value={examTypeId}
            onChange={(e) => setExamTypeId(e.target.value)}
            className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select type</option>
            {examTypeOptions.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="exam-name" className="text-xs font-medium text-zinc-500">
            Exam Name
          </label>
          <input
            id="exam-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mid Term 2026"
            className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="exam-start" className="text-xs font-medium text-zinc-500">
            Start Date
          </label>
          <input
            id="exam-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="exam-end" className="text-xs font-medium text-zinc-500">
            End Date
          </label>
          <input
            id="exam-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isSubmitting || !examTypeId || !name}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating…" : "Create Exam"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
