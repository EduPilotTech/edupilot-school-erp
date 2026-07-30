import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listHostels } from "@/modules/hostel/application/list-hostels.service";
import { listHostelRoomsByHostel } from "@/modules/hostel/application/list-hostel-rooms.service";
import { getRoomStudentList } from "@/modules/hostel/application/get-room-student-list.service";
import { getRoomHostelAttendance } from "@/modules/hostel/application/get-hostel-attendance.service";
import { HostelAttendanceMarker } from "@/components/features/hostel/HostelAttendanceMarker";
import type { HostelAttendanceSessionValue } from "@/modules/hostel/domain/hostel-attendance.entity";

interface HostelAttendancePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function HostelAttendancePage({ searchParams }: HostelAttendancePageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.attendance.mark");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions.find((s) => s.isCurrent)?.id || sessions[0]?.id || "";

  const hostels = await listHostels({ tenantId: authContext.tenantId }, { isActive: true });
  const roomLists = await Promise.all(
    hostels.map((hostel) => listHostelRoomsByHostel({ tenantId: authContext.tenantId }, hostel.id, { status: "ACTIVE" }))
  );
  const rooms = roomLists.flat();
  const roomId = first(params.roomId) || rooms[0]?.id || "";
  const date = first(params.date) ?? todayIsoDate();
  const session = (first(params.session) ?? "MORNING") as HostelAttendanceSessionValue;

  const canLoadRoster = Boolean(academicSessionId && roomId && date);

  const [studentList, existingAttendance] = canLoadRoster
    ? await Promise.all([
        getRoomStudentList(authContext.tenantId, roomId),
        getRoomHostelAttendance({ tenantId: authContext.tenantId }, roomId, new Date(date), session),
      ])
    : [[], []];

  const statusByStudentId = new Map(existingAttendance.map((row) => [row.studentId, row.status]));
  const rows = studentList.map((row) => ({
    studentId: row.studentId,
    admissionNumber: row.admissionNumber,
    fullName: row.fullName,
    status: statusByStudentId.get(row.studentId) ?? null,
  }));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Daily Hostel Attendance</h1>
      <p className="mt-1 text-sm text-zinc-500">Mark morning or night attendance for one room at a time.</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="academicSessionId" className="text-xs font-medium text-zinc-500">
            Academic Session
          </label>
          <select
            id="academicSessionId"
            name="academicSessionId"
            defaultValue={academicSessionId}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sessionName}
              </option>
            ))}
          </select>
        </div>
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
          Load Roster
        </button>
      </form>

      <div className="mt-6">
        {canLoadRoster ? (
          <HostelAttendanceMarker roomId={roomId} academicSessionId={academicSessionId} date={date} session={session} rows={rows} />
        ) : (
          <p className="text-sm text-zinc-500">Select a session, room, and date to load the roster.</p>
        )}
      </div>
    </main>
  );
}
