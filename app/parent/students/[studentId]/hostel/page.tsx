import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMyHostel } from "@/modules/parents/application/get-my-hostel.service";

interface PageProps {
  params: Promise<{ studentId: string }>;
}

// Parent Portal Integration (Phase 11 requirement 10) — room, bed, today's attendance, and
// leave status, reusing the same guardian-access authorization every other parent-facing page
// in this app uses. Hostel Notices reuse the existing Notice Board at /parent/notices.
export default async function ParentStudentHostelPage({ params }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("parent.hostel.view");
  const { studentId } = await params;

  const hostel = await getMyHostel(studentId, {
    tenantId: authContext.tenantId,
    userProfileId: authContext.userId,
  });

  if (!hostel) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900">Hostel</h1>
        <p className="mt-4 text-sm text-zinc-500">This student is not assigned to hostel accommodation this session.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Hostel</h1>
      <p className="mt-1 text-sm text-zinc-500">
        <span className="font-medium text-zinc-900">{hostel.hostelName}</span> — {hostel.buildingName}, Room{" "}
        <span className="font-medium text-zinc-900">{hostel.roomNumber}</span>, Bed{" "}
        <span className="font-medium text-zinc-900">{hostel.bedNumber}</span>
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-500">Check-in Date</h2>
          <p className="mt-1 text-lg font-semibold text-zinc-900">{hostel.checkInDate}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-500">Status</h2>
          <p className="mt-1 text-lg font-semibold text-zinc-900">{hostel.status.replaceAll("_", " ")}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-500">Diet Preference</h2>
          <p className="mt-1 text-lg font-semibold text-zinc-900">{hostel.dietPreference ?? "Not set"}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-500">Pending Leave Requests</h2>
          <p className="mt-1 text-lg font-semibold text-zinc-900">{hostel.pendingLeaveCount}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-medium text-zinc-500">Today&apos;s Attendance</h2>
        <div className="mt-2 flex gap-6 text-sm">
          <p>
            Morning: <span className="font-medium text-zinc-900">{hostel.todayMorningStatus ?? "Not marked yet"}</span>
          </p>
          <p>
            Night: <span className="font-medium text-zinc-900">{hostel.todayNightStatus ?? "Not marked yet"}</span>
          </p>
        </div>
      </div>

      {hostel.upcomingApprovedLeave && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-500">Upcoming Approved Leave</h2>
          <p className="mt-1 text-lg font-semibold text-zinc-900">
            {hostel.upcomingApprovedLeave.leaveType} — {hostel.upcomingApprovedLeave.fromDate} to{" "}
            {hostel.upcomingApprovedLeave.toDate}
          </p>
        </div>
      )}
    </main>
  );
}
