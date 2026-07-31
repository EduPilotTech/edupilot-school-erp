"use client";

import { useMemo, useState } from "react";
import { sendNotificationNowAction, scheduleNotificationAction } from "@/app/notifications/actions";
import {
  NOTIFICATION_TYPE_OPTIONS,
  NOTIFICATION_PRIORITY_OPTIONS,
} from "@/components/features/notifications/notification-type-labels";
import type { NotificationTemplateDTO } from "@/modules/communication/application/dto/notification-template.dto";
import type { NotificationTypeValue } from "@/modules/communication/domain/notification.entity";
import type { QueuedNotificationResult } from "@/modules/communication/application/notification-queue.service";

interface RecipientOption {
  id: string;
  fullName: string;
  email: string | null;
}

interface ComposeNotificationFormProps {
  recipients: RecipientOption[];
  templates: NotificationTemplateDTO[];
}

type WhenChoice = "NOW" | "SCHEDULE";

// The admin "compose and send a notification" screen (distinct from a user's own personal in-app
// inbox). Submits to sendNotificationNowAction or scheduleNotificationAction depending on the
// "When" choice. Either a template (+ variables) or a plain title/body is sent, mirroring
// queueNotificationSchema's own either/or shape (modules/communication/application/dto/
// notification-queue.dto.ts).
export function ComposeNotificationForm({ recipients, templates }: ComposeNotificationFormProps) {
  const [recipientUserProfileId, setRecipientUserProfileId] = useState("");
  const [type, setType] = useState<NotificationTypeValue>("NOTICE");
  const [priority, setPriority] = useState<(typeof NOTIFICATION_PRIORITY_OPTIONS)[number]["value"]>("NORMAL");
  const [useTemplate, setUseTemplate] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [when, setWhen] = useState<WhenChoice>("NOW");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueuedNotificationResult | null>(null);

  const activeTemplates = useMemo(() => templates.filter((t) => t.isActive), [templates]);
  const selectedTemplate = useMemo(
    () => activeTemplates.find((t) => t.id === templateId) ?? null,
    [activeTemplates, templateId]
  );

  function handleSelectTemplate(id: string) {
    setTemplateId(id);
    const template = activeTemplates.find((t) => t.id === id);
    const nextVariables: Record<string, string> = {};
    for (const variable of template?.variables ?? []) {
      nextVariables[variable] = "";
    }
    setTemplateVariables(nextVariables);
  }

  const canSubmit =
    Boolean(recipientUserProfileId) &&
    (useTemplate ? Boolean(templateId) : Boolean(title.trim() && body.trim())) &&
    (when === "NOW" || Boolean(scheduledAt));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const basePayload = {
        recipientUserProfileId,
        type,
        priority,
        ...(useTemplate
          ? { templateId, variables: templateVariables }
          : { title: title.trim(), body: body.trim() }),
      };

      const actionResult =
        when === "NOW"
          ? await sendNotificationNowAction(basePayload)
          : await scheduleNotificationAction({ ...basePayload, scheduledAt: new Date(scheduledAt).toISOString() });

      if (!actionResult.success) {
        setError(actionResult.error.message);
        return;
      }

      setResult(actionResult.data);
      setRecipientUserProfileId("");
      setTitle("");
      setBody("");
      setTemplateId("");
      setTemplateVariables({});
      setScheduledAt("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="compose-recipient" className="text-xs font-medium text-zinc-500">
            Recipient
          </label>
          <select
            id="compose-recipient"
            value={recipientUserProfileId}
            onChange={(e) => setRecipientUserProfileId(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select recipient</option>
            {recipients.map((recipient) => (
              <option key={recipient.id} value={recipient.id}>
                {recipient.email ? `${recipient.fullName} (${recipient.email})` : recipient.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="compose-type" className="text-xs font-medium text-zinc-500">
            Type
          </label>
          <select
            id="compose-type"
            value={type}
            onChange={(e) => setType(e.target.value as NotificationTypeValue)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {NOTIFICATION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="compose-priority" className="text-xs font-medium text-zinc-500">
            Priority
          </label>
          <select
            id="compose-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as (typeof NOTIFICATION_PRIORITY_OPTIONS)[number]["value"])}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {NOTIFICATION_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500">When</span>
          <div className="flex items-center gap-4 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm">
            <label htmlFor="compose-when-now" className="flex items-center gap-1.5">
              <input
                id="compose-when-now"
                type="radio"
                name="when"
                checked={when === "NOW"}
                onChange={() => setWhen("NOW")}
                className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500/40"
              />
              Send Now
            </label>
            <label htmlFor="compose-when-schedule" className="flex items-center gap-1.5">
              <input
                id="compose-when-schedule"
                type="radio"
                name="when"
                checked={when === "SCHEDULE"}
                onChange={() => setWhen("SCHEDULE")}
                className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500/40"
              />
              Schedule
            </label>
          </div>
        </div>

        {when === "SCHEDULE" && (
          <div className="flex flex-col gap-1">
            <label htmlFor="compose-scheduled-at" className="text-xs font-medium text-zinc-500">
              Scheduled For
            </label>
            <input
              id="compose-scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
        )}
      </div>

      <label htmlFor="compose-use-template" className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <input
          id="compose-use-template"
          type="checkbox"
          checked={useTemplate}
          onChange={(e) => {
            setUseTemplate(e.target.checked);
            if (!e.target.checked) {
              setTemplateId("");
              setTemplateVariables({});
            }
          }}
          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500/40"
        />
        Use Template
      </label>

      {useTemplate ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="compose-template" className="text-xs font-medium text-zinc-500">
              Template
            </label>
            <select
              id="compose-template"
              value={templateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm sm:w-80"
            >
              <option value="">Select template</option>
              {activeTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.channel})
                </option>
              ))}
            </select>
          </div>

          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {selectedTemplate.variables.map((variable) => (
                <div key={variable} className="flex flex-col gap-1">
                  <label htmlFor={`compose-variable-${variable}`} className="text-xs font-medium text-zinc-500">
                    {variable}
                  </label>
                  <input
                    id={`compose-variable-${variable}`}
                    value={templateVariables[variable] ?? ""}
                    onChange={(e) =>
                      setTemplateVariables((prev) => ({ ...prev, [variable]: e.target.value }))
                    }
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="compose-title" className="text-xs font-medium text-zinc-500">
              Title
            </label>
            <input
              id="compose-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="compose-body" className="text-xs font-medium text-zinc-500">
              Message
            </label>
            <textarea
              id="compose-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {result && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          Notification {result.notification.id} {when === "NOW" ? "sent" : "scheduled"} — queue status:{" "}
          {result.queueEntry.status}.
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting…" : when === "NOW" ? "Send Now" : "Schedule Notification"}
        </button>
      </div>
    </form>
  );
}
