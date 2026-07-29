"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCalendarEventAction } from "@/app/communication/actions";
import type { CalendarItemDTO } from "@/modules/communication/application/dto/calendar-event.dto";

interface CalendarEventManagerProps {
  academicSessionId: string;
  items: CalendarItemDTO[];
  canManage: boolean;
}

const EVENT_TYPES = ["EXAM", "PTM", "EVENT", "OTHER"] as const;

// School Calendar (requirement 15) — composed from the existing Holiday model (shown here
// read-only, source "HOLIDAY") UNIONed with new CalendarEvent rows this form creates
// (Phase 9 Decision 7).
export function CalendarEventManager({ academicSessionId, items, canManage }: CalendarEventManagerProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<(typeof EVENT_TYPES)[number]>("EVENT");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createCalendarEventAction({
        academicSessionId,
        title,
        eventType,
        startDate,
        endDate: endDate || undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setTitle("");
      setStartDate("");
      setEndDate("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="cal-title" className="text-xs font-medium text-zinc-500">
              Title
            </label>
            <input
              id="cal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="cal-type" className="text-xs font-medium text-zinc-500">
              Type
            </label>
            <select
              id="cal-type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as (typeof EVENT_TYPES)[number])}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {EVENT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="cal-start" className="text-xs font-medium text-zinc-500">
              Start Date
            </label>
            <input id="cal-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="cal-end" className="text-xs font-medium text-zinc-500">
              End Date (optional)
            </label>
            <input id="cal-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm" />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !title || !startDate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Event"}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Title</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((item) => (
              <tr key={`${item.source}-${item.id}`}>
                <td className="px-4 py-2 text-zinc-900">
                  {item.startDate}
                  {item.endDate ? ` – ${item.endDate}` : ""}
                </td>
                <td className="px-4 py-2 text-zinc-700">{item.title}</td>
                <td className="px-4 py-2 text-zinc-700">{item.eventType}</td>
                <td className="px-4 py-2 text-zinc-500">{item.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No calendar entries yet.</p>}
      </div>
    </div>
  );
}
