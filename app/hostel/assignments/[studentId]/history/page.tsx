import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getStudentHostelHistory } from "@/modules/hostel/application/get-student-hostel-assignment.service";
import { PrismaHostelRoomRepository } from "@/modules/hostel/infrastructure/prisma-hostel-room.repository";
import { PrismaHostelBedRepository } from "@/modules/hostel/infrastructure/prisma-hostel-bed.repository";

interface HistoryPageProps {
  params: Promise<{ studentId: string }>;
}

// History (Phase 11 requirement) — every past and current StudentHostelAssignment row for this
// student, most recent first. Append-only by design (see StudentHostelAssignmentEntity's own
// comment), so this is a plain read, never reconstructed from an audit log.
export default async function StudentHostelHistoryPage({ params }: HistoryPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.assignment.manage");

  const { studentId } = await params;
  const history = await getStudentHostelHistory(authContext.tenantId, studentId);

  const roomRepository = new PrismaHostelRoomRepository();
  const bedRepository = new PrismaHostelBedRepository();
  const rows = await Promise.all(
    history.map(async (assignment) => {
      const [room, bed] = await Promise.all([
        roomRepository.findById(authContext.tenantId, assignment.roomId),
        bedRepository.findById(authContext.tenantId, assignment.bedId),
      ]);
      return {
        ...assignment,
        roomNumber: room?.roomNumber ?? "Unknown",
        bedNumber: bed?.bedNumber ?? "Unknown",
      };
    })
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/hostel/assignments" className="text-sm text-blue-600 hover:underline">
        ← Student Hostel Assignment
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Hostel Assignment History</h1>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Room</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Bed</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Check-in</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Check-out</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{row.roomNumber}</td>
                <td className="px-4 py-2 text-zinc-700">{row.bedNumber}</td>
                <td className="px-4 py-2 text-zinc-700">{row.checkInDate}</td>
                <td className="px-4 py-2 text-zinc-700">{row.checkOutDate ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No hostel assignment history.</p>}
      </div>
    </main>
  );
}
