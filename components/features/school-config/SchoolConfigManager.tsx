"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  setWorkingDaysAction,
  setPeriodConfigurationAction,
  addHolidayAction,
  removeHolidayAction,
} from "@/app/settings/school-config/actions";
import type {
  HolidayDTO,
  PeriodConfigurationDTO,
  WorkingDayDTO,
} from "@/modules/timetable/application/dto/school-config.dto";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};
const DAY_ORDER = Object.keys(DAY_LABELS);

interface SchoolConfigManagerProps {
  academicSessionId: string;
  initialWorkingDays: WorkingDayDTO[];
  initialPeriods: PeriodConfigurationDTO[];
  initialHolidays: HolidayDTO[];
  canManage: boolean;
}

interface PeriodDraft {
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

function defaultWorkingDays(existing: WorkingDayDTO[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const day of DAY_ORDER) {
    const found = existing.find((d) => d.dayOfWeek === day);
    map[day] = found ? found.isWorking : day !== "SUNDAY";
  }
  return map;
}

// Working Days, Period Configuration (breaks are just `isBreak: true` periods — Phase 6
// Decision 3), and Holiday Calendar for one AcademicSession, in one client component. Each
// section saves independently (three separate Server Actions), not one giant form submit.
export function SchoolConfigManager({
  academicSessionId,
  initialWorkingDays,
  initialPeriods,
  initialHolidays,
  canManage,
}: SchoolConfigManagerProps) {
  const router = useRouter();
  const [workingDays, setWorkingDaysState] = useState(defaultWorkingDays(initialWorkingDays));
  const [periods, setPeriods] = useState<PeriodDraft[]>(
    initialPeriods.length > 0
      ? initialPeriods.map((p) => ({
          periodNumber: p.periodNumber,
          startTime: p.startTime,
          endTime: p.endTime,
          isBreak: p.isBreak,
        }))
      : [{ periodNumber: 1, startTime: "09:00", endTime: "09:45", isBreak: false }]
  );
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [isSavingDays, setIsSavingDays] = useState(false);
  const [isSavingPeriods, setIsSavingPeriods] = useState(false);
  const [isSavingHoliday, setIsSavingHoliday] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSaveWorkingDays() {
    setIsSavingDays(true);
    setError(null);
    setMessage(null);
    try {
      const result = await setWorkingDaysAction({
        academicSessionId,
        days: DAY_ORDER.map((dayOfWeek) => ({ dayOfWeek, isWorking: workingDays[dayOfWeek] })),
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMessage("Working days saved.");
      router.refresh();
    } finally {
      setIsSavingDays(false);
    }
  }

  function addPeriodRow() {
    const nextNumber = periods.length > 0 ? Math.max(...periods.map((p) => p.periodNumber)) + 1 : 1;
    setPeriods([...periods, { periodNumber: nextNumber, startTime: "", endTime: "", isBreak: false }]);
  }

  function updatePeriod(index: number, patch: Partial<PeriodDraft>) {
    setPeriods(periods.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function removePeriodRow(index: number) {
    setPeriods(periods.filter((_, i) => i !== index));
  }

  async function handleSavePeriods() {
    setIsSavingPeriods(true);
    setError(null);
    setMessage(null);
    try {
      const result = await setPeriodConfigurationAction({ academicSessionId, periods });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMessage("Period configuration saved.");
      router.refresh();
    } finally {
      setIsSavingPeriods(false);
    }
  }

  async function handleAddHoliday() {
    setIsSavingHoliday(true);
    setError(null);
    setMessage(null);
    try {
      const result = await addHolidayAction({ academicSessionId, date: holidayDate, name: holidayName });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setHolidayDate("");
      setHolidayName("");
      router.refresh();
    } finally {
      setIsSavingHoliday(false);
    }
  }

  async function handleRemoveHoliday(holidayId: string) {
    setError(null);
    const result = await removeHolidayAction(holidayId);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      {message && (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">{message}</p>
      )}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Working Days</h2>
        <div className="mt-3 flex flex-wrap gap-4">
          {DAY_ORDER.map((day) => (
            <label key={day} className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={workingDays[day]}
                disabled={!canManage}
                onChange={(e) => setWorkingDaysState({ ...workingDays, [day]: e.target.checked })}
              />
              {DAY_LABELS[day]}
            </label>
          ))}
        </div>
        {canManage && (
          <button
            type="button"
            onClick={handleSaveWorkingDays}
            disabled={isSavingDays}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingDays ? "Saving…" : "Save Working Days"}
          </button>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Period Configuration</h2>
        <p className="mt-0.5 text-sm text-zinc-500">A break is just a period with &quot;Break&quot; checked.</p>
        <div className="mt-3 flex flex-col gap-2">
          {periods.map((period, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <span className="w-6 text-sm text-zinc-500">#{period.periodNumber}</span>
              <input
                type="time"
                value={period.startTime}
                disabled={!canManage}
                onChange={(e) => updatePeriod(index, { startTime: e.target.value })}
                className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
              />
              <span className="text-sm text-zinc-500">to</span>
              <input
                type="time"
                value={period.endTime}
                disabled={!canManage}
                onChange={(e) => updatePeriod(index, { endTime: e.target.value })}
                className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
              />
              <label className="flex items-center gap-1 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={period.isBreak}
                  disabled={!canManage}
                  onChange={(e) => updatePeriod(index, { isBreak: e.target.checked })}
                />
                Break
              </label>
              {canManage && (
                <button
                  type="button"
                  onClick={() => removePeriodRow(index)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        {canManage && (
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={addPeriodRow}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
            >
              Add Period
            </button>
            <button
              type="button"
              onClick={handleSavePeriods}
              disabled={isSavingPeriods}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingPeriods ? "Saving…" : "Save Periods"}
            </button>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Holiday Calendar</h2>
        {canManage && (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="holiday-date" className="text-xs font-medium text-zinc-500">
                Date
              </label>
              <input
                id="holiday-date"
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="holiday-name" className="text-xs font-medium text-zinc-500">
                Name
              </label>
              <input
                id="holiday-name"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder="Independence Day"
                className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleAddHoliday}
              disabled={isSavingHoliday || !holidayDate || !holidayName}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingHoliday ? "Adding…" : "Add Holiday"}
            </button>
          </div>
        )}

        <ul className="mt-4 divide-y divide-zinc-100">
          {initialHolidays.map((holiday) => (
            <li key={holiday.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-zinc-900">
                {holiday.date.toISOString().slice(0, 10)} — {holiday.name}
              </span>
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleRemoveHoliday(holiday.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
          {initialHolidays.length === 0 && <li className="py-2 text-sm text-zinc-500">No holidays yet.</li>}
        </ul>
      </section>
    </div>
  );
}
