const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export interface TimetablePrintPeriod {
  id: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

export interface TimetablePrintEntry {
  dayOfWeek: string;
  periodNumber: number;
  subjectName: string;
  teacherName: string;
  className: string;
  sectionName: string;
  classroomName: string | null;
}

interface TimetablePrintGridProps {
  title: string;
  subtitle?: string;
  workingDays: string[];
  periods: TimetablePrintPeriod[];
  entries: TimetablePrintEntry[];
  showClassColumn?: boolean;
}

// Pure, presentational — the same grid shape backs all three print views (Teacher/Class/
// Classroom); only the data source and `showClassColumn` (useful for Teacher/Classroom views,
// where a slot could belong to a different class each period) differ per caller.
export function TimetablePrintGrid({
  title,
  subtitle,
  workingDays,
  periods,
  entries,
  showClassColumn = false,
}: TimetablePrintGridProps) {
  const entryMap = new Map(entries.map((entry) => [`${entry.dayOfWeek}|${entry.periodNumber}`, entry]));

  return (
    <div id="timetable-print-area" className="rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}

      <table className="mt-4 min-w-full divide-y divide-zinc-200 border border-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="border border-zinc-200 px-3 py-2 text-left font-medium text-zinc-500">Period</th>
            {workingDays.map((day) => (
              <th key={day} className="border border-zinc-200 px-3 py-2 text-left font-medium text-zinc-500">
                {DAY_LABELS[day] ?? day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period.id}>
              <td className="border border-zinc-200 px-3 py-2 align-top text-zinc-700">
                <div className="font-medium">#{period.periodNumber}</div>
                <div className="text-xs text-zinc-500">
                  {period.startTime}–{period.endTime}
                </div>
              </td>
              {period.isBreak ? (
                <td
                  colSpan={workingDays.length}
                  className="border border-zinc-200 bg-zinc-50 px-3 py-2 text-center text-xs text-zinc-500"
                >
                  Break
                </td>
              ) : (
                workingDays.map((day) => {
                  const entry = entryMap.get(`${day}|${period.periodNumber}`);
                  return (
                    <td key={day} className="border border-zinc-200 px-3 py-2 align-top">
                      {entry ? (
                        <div>
                          <div className="font-medium text-zinc-900">{entry.subjectName}</div>
                          <div className="text-xs text-zinc-500">{entry.teacherName}</div>
                          {showClassColumn && (
                            <div className="text-xs text-zinc-400">
                              {entry.className} {entry.sectionName}
                            </div>
                          )}
                          {entry.classroomName && <div className="text-xs text-zinc-400">{entry.classroomName}</div>}
                        </div>
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
