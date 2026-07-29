"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendMessageAsTeacherAction } from "@/app/communication/actions";

interface TeacherMessageComposerProps {
  studentId: string;
  guardianId: string;
}

export function TeacherMessageComposer({ studentId, guardianId }: TeacherMessageComposerProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setIsSending(true);
    setError(null);
    try {
      const result = await sendMessageAsTeacherAction({ studentId, guardianId, body });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setBody("");
      router.refresh();
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Type a reply…"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={isSending || !body.trim()}
        className="self-end rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSending ? "Sending…" : "Send"}
      </button>
    </div>
  );
}
