import type { StudentStatusValue } from "@/modules/students/domain/student.entity";

interface StudentStatusBadgeProps {
  status: StudentStatusValue;
  deletedAt: Date | null;
}

const STATUS_STYLES: Record<StudentStatusValue, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  TRANSFERRED: "bg-amber-50 text-amber-700 border-amber-200",
  GRADUATED: "bg-blue-50 text-blue-700 border-blue-200",
  WITHDRAWN: "bg-red-50 text-red-700 border-red-200",
};

// Pure presentational — Server Component, mirrors app/settings/users/_components/
// user-status-badge.tsx's "deletedAt shown as its own state, orthogonal to status" convention.
export function StudentStatusBadge({ status, deletedAt }: StudentStatusBadgeProps) {
  if (deletedAt) {
    return (
      <span className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
        Deleted
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
