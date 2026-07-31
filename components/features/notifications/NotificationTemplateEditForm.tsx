"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateNotificationTemplateAction } from "@/app/notifications/actions";
import type { NotificationTemplateDTO } from "@/modules/communication/application/dto/notification-template.dto";

interface NotificationTemplateEditFormProps {
  template: NotificationTemplateDTO;
}

// `name`/`channel` are immutable after creation (updateNotificationTemplateSchema carries no
// fields for either) — shown here read-only, with subject/message/variables/isActive editable.
export function NotificationTemplateEditForm({ template }: NotificationTemplateEditFormProps) {
  const router = useRouter();
  const [subject, setSubject] = useState(template.subject ?? "");
  const [message, setMessage] = useState(template.message);
  const [variablesText, setVariablesText] = useState(template.variables.join(", "));
  const [isActive, setIsActive] = useState(template.isActive);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function parseVariables(text: string): string[] {
    return text
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await updateNotificationTemplateAction(template.id, {
        subject: template.channel === "EMAIL" && subject ? subject : undefined,
        message,
        variables: parseVariables(variablesText),
        isActive,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setSuccess(true);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500">Name</span>
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-700">
            {template.name}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500">Channel</span>
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-700">
            {template.channel}
          </p>
        </div>
      </div>

      {template.channel === "EMAIL" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="edit-template-subject" className="text-xs font-medium text-zinc-500">
            Subject
          </label>
          <input
            id="edit-template-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="edit-template-message" className="text-xs font-medium text-zinc-500">
          Message
        </label>
        <textarea
          id="edit-template-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="edit-template-variables" className="text-xs font-medium text-zinc-500">
          Variables (comma-separated)
        </label>
        <input
          id="edit-template-variables"
          value={variablesText}
          onChange={(e) => setVariablesText(e.target.value)}
          placeholder="studentName, amount, dueDate"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
        />
      </div>

      <label htmlFor="edit-template-active" className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <input
          id="edit-template-active"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500/40"
        />
        Active
      </label>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          Template updated.
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={isSubmitting || !message}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
