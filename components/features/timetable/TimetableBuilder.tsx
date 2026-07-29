"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTimetableEntryAction,
  deleteTimetableEntryAction,
} from "@/app/timetable/actions";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

export interface TimetablePeriodRow {
  id: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

export interface TimetableGridCell {
  id: string;
  dayOfWeek: string;
  periodNumber: number;
  subjectName: string;
  teacherName: string;
  classroomName: string | null;
}

export interface AssignmentOption {
  id: string;
  label: string;
}

export interface ClassroomOption {
  id: string;
  name: string;
}

interface TimetableBuilderProps {
  workingDays: string[];
  periods: TimetablePeriodRow[];
  entries: TimetableGridCell[];
  assignmentOptions: AssignmentOption[];
  classroomOptions: ClassroomOption[];
  canManage: boolean;
}

// Day x period grid, click-to-assign. Every cell can only be filled from `assignmentOptions` —
// the set of existing TeacherAssignments for this class/section (Phase 6 Decision 4: no ad-hoc
// teacher allocation). Conflict errors surface inline per-cell, from the same
// create-timetable-entry.service.ts validation the Server Action already runs — this component
// does not duplicate that logic client-side, it just displays whatever the action returns.
export function TimetableBuilder({
  workingDays,
  periods,
  entries,
  assignmentOptions,
  classroomOptions,
  canManage,
}: TimetableBuilderProps) {
  const router = useRouter();
  const [editingCell, setEditingCell] = useState<{ day: string; periodId: string } | null>(null);
  const [assignmentId, setAssignmentId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cellError, setCellError] = useState<string | null>(null);

  const entryMap = new Map(entries.map((entry) => [`${entry.dayOfWeek}|${entry.periodNumber}`, entry]));

  function openCell(day: string, periodId: string) {
    setEditingCell({ day, periodId });
    setAssignmentId("");
    setClassroomId("");
    setCellError(null);
  }

  function closeCell() {
    setEditingCell(null);
    setCellError(null);
  }

  async function handleSaveCell() {
    if (!editingCell) return;
    setIsSubmitting(true);
    setCellError(null);
    try {
      const result = await createTimetableEntryAction({
        teacherAssignmentId: assignmentId,
        periodId: editingCell.periodId,
        dayOfWeek: editingCell.day,
        classroomId: classroomId || undefined,
      });
      if (!result.success) {
        setCellError(result.error.message);
        return;
      }
      closeCell();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleClearCell(entryId: string) {
    setIsSubmitting(true);
    setCellError(null);
    try {
      const result = await deleteTimetableEntryAction(entryId);
      if (!result.success) {
        setCellError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-zinc-500">Period</th>
            {workingDays.map((day) => (
              <th key={day} className="px-3 py-2 text-left font-medium text-zinc-500">
                {DAY_LABELS[day] ?? day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {periods.map((period) => (
            <tr key={period.id}>
              <td className="px-3 py-2 align-top text-zinc-700">
                <div className="font-medium">#{period.periodNumber}</div>
                <div className="text-xs text-zinc-500">
                  {period.startTime}–{period.endTime}
                </div>
              </td>
              {period.isBreak ? (
                <td colSpan={workingDays.length} className="bg-zinc-50 px-3 py-2 text-center text-xs text-zinc-500">
                  Break
                </td>
              ) : (
                workingDays.map((day) => {
                  const entry = entryMap.get(`${day}|${period.periodNumber}`);
                  const isEditing = editingCell?.day === day && editingCell.periodId === period.id;

                  return (
                    <td key={day} className="min-w-[160px] px-3 py-2 align-top">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <select
                            value={assignmentId}
                            onChange={(e) => setAssignmentId(e.target.value)}
                            className="rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                          >
                            <option value="">Select subject/teacher</option>
                            {assignmentOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={classroomId}
                            onChange={(e) => setClassroomId(e.target.value)}
                            className="rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                          >
                            <option value="">No room</option>
                            {classroomOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                          {cellError && <p className="text-xs text-red-600">{cellError}</p>}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleSaveCell}
                              disabled={isSubmitting || !assignmentId}
                              className="rounded bg-blue-600 px-2 py-1 text-xs text-white disabled:opacity-60"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={closeCell}
                              className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : entry ? (
                        <div>
                          <div className="font-medium text-zinc-900">{entry.subjectName}</div>
                          <div className="text-xs text-zinc-500">{entry.teacherName}</div>
                          {entry.classroomName && <div className="text-xs text-zinc-400">{entry.classroomName}</div>}
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => handleClearCell(entry.id)}
                              disabled={isSubmitting}
                              className="mt-1 text-xs text-red-600 hover:underline disabled:opacity-50"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      ) : canManage ? (
                        <button
                          type="button"
                          onClick={() => openCell(day, period.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          + Add
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-300">—</span>
                      )}
                    </td>
                  );
                })
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
