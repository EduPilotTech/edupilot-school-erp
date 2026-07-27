import type { UserProfileStatusValue } from "@/modules/users/domain/user-profile.entity";

interface UserStatusBadgeProps {
  status: UserProfileStatusValue;
  deletedAt: Date | null;
}

const STATUS_STYLES: Record<UserProfileStatusValue, string> = {
  INVITED: "bg-amber-50 text-amber-700 border-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SUSPENDED: "bg-red-50 text-red-700 border-red-200",
  INACTIVE: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

// Pure presentational — Server Component (no interactivity, no "use client" needed).
// `deletedAt` is shown as its own state regardless of the underlying `status` value, per the
// Sprint 3 lifecycle design: deletion is orthogonal to status, not a fifth enum member.
export function UserStatusBadge({ status, deletedAt }: UserStatusBadgeProps) {
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
