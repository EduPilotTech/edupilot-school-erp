"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNoticeAction, publishNoticeAction } from "@/app/communication/actions";
import type { NoticeDTO } from "@/modules/communication/application/dto/notice.dto";

interface Option {
  id: string;
  name: string;
}

interface NoticeManagerProps {
  academicSessionId: string;
  items: NoticeDTO[];
  classes: Option[];
  sections: Option[];
  canManage: boolean;
}

const AUDIENCES = ["ALL", "CLASS", "SECTION"] as const;

// Notice Board AND Broadcast Messages (Phase 9 Decision 4) — creating a Notice drafts it;
// publishing dispatches a Notification to every guardian with linked portal access in scope.
export function NoticeManager({ academicSessionId, items, classes, sections, canManage }: NoticeManagerProps) {
  const router = useRouter();
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>("ALL");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createNoticeAction({
        academicSessionId,
        title,
        body,
        audience,
        classId: audience !== "ALL" ? classId : undefined,
        sectionId: audience === "SECTION" ? sectionId : undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setTitle("");
      setBody("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublish(noticeId: string) {
    setPublishingId(noticeId);
    setError(null);
    try {
      const result = await publishNoticeAction(noticeId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="notice-audience" className="text-xs font-medium text-zinc-500">
                Audience
              </label>
              <select
                id="notice-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value as (typeof AUDIENCES)[number])}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              >
                {AUDIENCES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            {audience !== "ALL" && (
              <div className="flex flex-col gap-1">
                <label htmlFor="notice-class" className="text-xs font-medium text-zinc-500">
                  Class
                </label>
                <select id="notice-class" value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm">
                  {classes.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {audience === "SECTION" && (
              <div className="flex flex-col gap-1">
                <label htmlFor="notice-section" className="text-xs font-medium text-zinc-500">
                  Section
                </label>
                <select id="notice-section" value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm">
                  {sections.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notice body"
            rows={3}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !title || !body}
            className="self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Save Draft"}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((notice) => (
          <div key={notice.id} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">{notice.title}</h2>
              <span className="text-xs text-zinc-500">
                {notice.audience} · {notice.publishedAt ? "Published" : "Draft"}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-700">{notice.body}</p>
            {canManage && !notice.publishedAt && (
              <button
                type="button"
                onClick={() => handlePublish(notice.id)}
                disabled={publishingId === notice.id}
                className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {publishingId === notice.id ? "Publishing…" : "Publish Now"}
              </button>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-zinc-500">No notices yet.</p>}
      </div>
    </div>
  );
}
