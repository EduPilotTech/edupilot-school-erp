"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendMessageAction, listMyTeachersForChildAction } from "@/app/parent/actions";
import type { MyChildTeacherDTO } from "@/modules/parents/application/list-my-teachers-for-child.service";

interface ChildOption {
  studentId: string;
  fullName: string;
}

interface NewMessageFormProps {
  myChildren: ChildOption[];
}

// Starts a new (or continues an existing) thread — postMessage finds-or-creates on the
// (student, guardian, teacher) triple, so picking a child + teacher a parent has already
// messaged just continues that conversation.
export function NewMessageForm({ myChildren }: NewMessageFormProps) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(myChildren[0]?.studentId ?? "");
  const [teacherId, setTeacherId] = useState("");
  const [teachers, setTeachers] = useState<MyChildTeacherDTO[]>([]);
  const [body, setBody] = useState("");
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;

    // Defers the "start loading" setState calls into the promise chain rather than the
    // synchronous effect body (react-hooks/set-state-in-effect) — also guards against a stale
    // response landing after `studentId` has already changed again.
    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined;
        setIsLoadingTeachers(true);
        setTeacherId("");
        return listMyTeachersForChildAction(studentId);
      })
      .then((result) => {
        if (cancelled || !result) return;
        if (result.success) {
          setTeachers(result.data);
          setTeacherId(result.data[0]?.teacherId ?? "");
        } else {
          setError(result.error.message);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTeachers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  async function handleSend() {
    setIsSending(true);
    setError(null);
    try {
      const result = await sendMessageAction({ studentId, teacherId, body });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.push(`/parent/messages/${result.data.threadId}`);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="new-message-child" className="text-xs font-medium text-zinc-500">
          Child
        </label>
        <select
          id="new-message-child"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
        >
          {myChildren.map((child) => (
            <option key={child.studentId} value={child.studentId}>
              {child.fullName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="new-message-teacher" className="text-xs font-medium text-zinc-500">
          Teacher
        </label>
        <select
          id="new-message-teacher"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          disabled={isLoadingTeachers}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
        >
          {teachers.map((teacher) => (
            <option key={teacher.teacherId} value={teacher.teacherId}>
              {teacher.fullName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="new-message-body" className="text-xs font-medium text-zinc-500">
          Message
        </label>
        <textarea
          id="new-message-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="button"
        onClick={handleSend}
        disabled={isSending || !studentId || !teacherId || !body.trim()}
        className="self-end rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSending ? "Sending…" : "Send"}
      </button>
    </div>
  );
}
