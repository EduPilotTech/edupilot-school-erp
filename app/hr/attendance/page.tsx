import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listEmployees } from "@/modules/hr/application/employee.service";
import { PrismaTeacherAttendanceRepository } from "@/modules/attendance/infrastructure/prisma-teacher-attendance.repository";
import { StaffAttendanceMarker } from "@/components/features/hr/StaffAttendanceMarker";

interface StaffAttendancePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Mirrors app/attendance/mark/page.tsx's shape but simpler — staff attendance has no class/
// section/session scope, just a date and the full active-employee roster. Reads the roster via
// modules/hr's listEmployees service and today's-date attendance via
// PrismaTeacherAttendanceRepository.findByDate directly (there is no dedicated "daily staff
// attendance" application service yet — this mirrors the direct-repository-read precedent already
// used elsewhere for pure reads, e.g. app/hostel/floors/[floorId]/page.tsx). Submitting a row
// calls the EXISTING markTeacherAttendanceAction from app/attendance/actions.ts, not a new HR
// action.
export default async function StaffAttendancePage({ searchParams }: StaffAttendancePageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("attendance.teacher.mark");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const date = first(params.date) ?? todayIsoDate();

  const [employeeResult, attendanceRecords] = await Promise.all([
    listEmployees({ page: 1, pageSize: 100 }, { tenantId: authContext.tenantId }),
    new PrismaTeacherAttendanceRepository().findByDate(authContext.tenantId, new Date(date)),
  ]);

  const activeEmployees = employeeResult.items.filter((employee) => employee.isActive);
  const recordByUserProfileId = new Map(attendanceRecords.map((record) => [record.userProfileId, record]));

  const rows = activeEmployees.map((employee) => {
    const record = recordByUserProfileId.get(employee.userProfileId);
    return {
      userProfileId: employee.userProfileId,
      fullName: employee.fullName,
      employeeCode: employee.employeeCode,
      status: record?.status ?? null,
      checkInTime: record?.checkInTime ?? null,
      checkOutTime: record?.checkOutTime ?? null,
      remarks: record?.remarks ?? null,
    };
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/hr" className="text-sm text-blue-600 hover:underline">
            ← HR & Payroll
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Staff Attendance</h1>
          <p className="mt-1 text-sm text-zinc-500">Mark daily attendance for every active staff member.</p>
        </div>
        <Link
          href="/hr/attendance/monthly"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Monthly Report
        </Link>
      </div>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="date" className="text-xs font-medium text-zinc-500">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={date}
            max={todayIsoDate()}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Load
        </button>
      </form>

      <div className="mt-6">
        <StaffAttendanceMarker date={date} rows={rows} />
      </div>
    </main>
  );
}
