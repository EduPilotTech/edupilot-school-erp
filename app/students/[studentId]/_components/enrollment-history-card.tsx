import { Card } from "@/components/ui/Card";
import { EmptyState } from "./empty-state";
import type { StudentProfileDTO } from "@/modules/students/application/dto/student-profile.dto";

interface EnrollmentHistoryCardProps {
  enrollments: StudentProfileDTO["enrollmentHistory"];
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  TRANSFERRED_OUT: "Transferred Out",
};

// Every Enrollment row for this student, current first (see get-student-profile.service.ts's
// sort) — "Current enrollment," "Previous enrollment," and "Promotion history" from the task are
// all just this one ordered list: whichever row has no `endDate` is current, everything else is
// history. There's no separate "promotion" concept in the schema — a promotion IS a new
// Enrollment row, so promotion history and enrollment history are the same data.
export function EnrollmentHistoryCard({ enrollments }: EnrollmentHistoryCardProps) {
  return (
    <Card title="Enrollment History">
      {enrollments.length === 0 ? (
        <EmptyState message="No enrollment records found." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="py-2 pr-4">Session</th>
                <th className="py-2 pr-4">Class / Section</th>
                <th className="py-2 pr-4">Roll #</th>
                <th className="py-2 pr-4">Start</th>
                <th className="py-2 pr-4">End</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="border-b border-zinc-100 last:border-0">
                  <td className="py-2 pr-4 text-zinc-900">{enrollment.academicSessionName}</td>
                  <td className="py-2 pr-4 text-zinc-600">
                    {enrollment.className} - {enrollment.sectionName}
                  </td>
                  <td className="py-2 pr-4 text-zinc-600">{enrollment.rollNumber ?? "—"}</td>
                  <td className="py-2 pr-4 text-zinc-600">
                    {enrollment.startDate.toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-4 text-zinc-600">
                    {enrollment.endDate ? enrollment.endDate.toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2 pr-4">
                    {enrollment.isCurrent ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Current
                      </span>
                    ) : (
                      <span className="rounded-full border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
                        {STATUS_LABELS[enrollment.status] ?? enrollment.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
