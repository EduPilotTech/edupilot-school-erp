"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createNotificationTemplateAction,
  updateNotificationTemplateAction,
  deleteNotificationTemplateAction,
} from "@/app/notifications/actions";
import { NOTIFICATION_CHANNEL_OPTIONS } from "@/components/features/notifications/notification-type-labels";
import type { NotificationTemplateDTO } from "@/modules/communication/application/dto/notification-template.dto";
import type { NotificationChannelValue } from "@/modules/communication/domain/notification-delivery.entity";

interface NotificationTemplateManagerProps {
  items: NotificationTemplateDTO[];
  canManage: boolean;
}

// Mirrors components/features/hr/LeaveTypeManager.tsx exactly: inline create form + table with
// Deactivate/Delete row actions, calling Server Actions directly and router.refresh() after every
// mutation. `name`/`channel` are create-only (updateNotificationTemplateSchema has no fields for
// either), so editing subject/message/variables/isActive happens on a separate
// /templates/[templateId]/edit page, reached via the "Edit" row link here.
export function NotificationTemplateManager({ items, canManage }: NotificationTemplateManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<NotificationChannelValue>("IN_APP");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [variablesText, setVariablesText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function parseVariables(text: string): string[] {
    return text
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createNotificationTemplateAction({
        name,
        channel,
        subject: channel === "EMAIL" && subject ? subject : undefined,
        message,
        variables: parseVariables(variablesText),
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setName("");
      setChannel("IN_APP");
      setSubject("");
      setMessage("");
      setVariablesText("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(template: NotificationTemplateDTO) {
    setEditingId(template.id);
    setError(null);
    try {
      const result = await updateNotificationTemplateAction(template.id, { isActive: !template.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(template: NotificationTemplateDTO) {
    setEditingId(template.id);
    setError(null);
    try {
      const result = await deleteNotificationTemplateAction(template.id);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="template-name" className="text-xs font-medium text-zinc-500">
              Name
            </label>
            <input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fee Due Reminder"
              className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="template-channel" className="text-xs font-medium text-zinc-500">
              Channel
            </label>
            <select
              id="template-channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value as NotificationChannelValue)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {NOTIFICATION_CHANNEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {channel === "EMAIL" && (
            <div className="flex flex-col gap-1">
              <label htmlFor="template-subject" className="text-xs font-medium text-zinc-500">
                Subject
              </label>
              <input
                id="template-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your fee is due"
                className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="template-message" className="text-xs font-medium text-zinc-500">
              Message
            </label>
            <textarea
              id="template-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Dear {{studentName}}, your fee of {{amount}} is due on {{dueDate}}."
              rows={2}
              className="w-72 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="template-variables" className="text-xs font-medium text-zinc-500">
              Variables (comma-separated)
            </label>
            <input
              id="template-variables"
              value={variablesText}
              onChange={(e) => setVariablesText(e.target.value)}
              placeholder="studentName, amount, dueDate"
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !name || !message}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Template"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Channel</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Subject</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((template) => (
              <tr key={template.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{template.name}</td>
                <td className="px-4 py-2 text-zinc-700">{template.channel}</td>
                <td className="px-4 py-2 text-zinc-700">{template.subject ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{template.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <Link href={`/templates/${template.id}/edit`} className="mr-3 text-sm text-blue-600 hover:underline">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(template)}
                      disabled={editingId === template.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {template.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(template)}
                      disabled={editingId === template.id}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No notification templates yet.</p>}
      </div>
    </div>
  );
}
