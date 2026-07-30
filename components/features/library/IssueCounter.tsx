"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { issueBookAction } from "@/app/library/actions";
import { MemberPicker } from "./MemberPicker";

interface CopyOption {
  id: string;
  label: string;
}

interface MemberOption {
  id: string;
  label: string;
}

interface IssueCounterProps {
  availableCopies: CopyOption[];
  students: MemberOption[];
  teachers: MemberOption[];
  staff: MemberOption[];
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function IssueCounter({ availableCopies, students, teachers, staff }: IssueCounterProps) {
  const router = useRouter();
  const [bookCopyId, setBookCopyId] = useState("");
  const [memberType, setMemberType] = useState("STUDENT");
  const [memberId, setMemberId] = useState("");
  const [issueDate, setIssueDate] = useState(todayIsoDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleIssue() {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await issueBookAction({ bookCopyId, memberType, memberId, issueDate });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMessage(`Issued — due back ${result.data.dueDate}.`);
      setBookCopyId("");
      setMemberId("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="issue-copy" className="text-xs font-medium text-zinc-500">
          Book Copy (Accession Number)
        </label>
        <select
          id="issue-copy"
          value={bookCopyId}
          onChange={(e) => setBookCopyId(e.target.value)}
          className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
        >
          <option value="">Select…</option>
          {availableCopies.map((copy) => (
            <option key={copy.id} value={copy.id}>
              {copy.label}
            </option>
          ))}
        </select>
      </div>
      <MemberPicker
        memberType={memberType}
        memberId={memberId}
        onMemberTypeChange={setMemberType}
        onMemberIdChange={setMemberId}
        students={students}
        teachers={teachers}
        staff={staff}
      />
      <div className="flex flex-col gap-1">
        <label htmlFor="issue-date" className="text-xs font-medium text-zinc-500">
          Issue Date
        </label>
        <input
          id="issue-date"
          type="date"
          value={issueDate}
          onChange={(e) => setIssueDate(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={handleIssue}
        disabled={isSubmitting || !bookCopyId || !memberId}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Issuing…" : "Issue Book"}
      </button>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
