import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listHostels } from "@/modules/hostel/application/list-hostels.service";
import { listHostelRoomsByHostel } from "@/modules/hostel/application/list-hostel-rooms.service";
import { getHostelAttendanceReport } from "@/modules/hostel/application/get-hostel-attendance-report.service";
import type { HostelAttendanceSessionValue } from "@/modules/hostel/domain/hostel-attendance.entity";

interface AttendanceReportPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function HostelAttendanceReportPage({ searchParams }: AttendanceReportPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const hostels = await listHostels({ tenantId: authContext.tenantId }, { isActive: true });
  const roomLists = await Promise.all(
    hostels.map((hostel) => listHostelRoomsByHostel({ tenantId: authContext.tenantId }, hostel.id, { status: "ACTIVE" }))
  );
  const rooms = roomLists.flat();
  const roomId = first(params.roomId) || rooms[0]?.id || "";
  const date = first(params.date) ?? todayIsoDate();
  const session = (first(params.session) ?? "MORNING") as HostelAttendanceSessionValue;

  const summary = roomId ? await getHostelAttendanceReport(authContext.tenantId, roomId, new Date(date), session) : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Hostel Attendance Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Present / absent / on-leave counts for one room, date, and session.</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="roomId" className="text-xs font-medium text-zinc-500">
            Room
          </label>
          <select
            id="roomId"
            name="roomId"
            defaultValue={roomId}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.roomNumber}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="date" className="text-xs font-medium text-zinc-500">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={date}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="session" className="text-xs font-medium text-zinc-500">
            Session
          </label>
          <select
            id="session"
            name="session"
            defaultValue={session}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="MORNING">Morning</option>
            <option value="NIGHT">Night</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Load
        </button>
      </form>

      {summary ? (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Present</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">{summary.presentCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Absent</p>
            <p className="mt-1 text-2xl font-semibold text-red-700">{summary.absentCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">On Leave</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">{summary.onLeaveCount}</p>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">Select a room and date to load the summary.</p>
      )}
    </main>
  );
}
