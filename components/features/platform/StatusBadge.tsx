// Shared by every Platform Admin (Phase 16, Bundle E Part Two) list/detail screen — mirrors
// components/features/payroll/StatusBadge.tsx's exact shape (no shared Badge primitive exists in
// components/ui). Kept as its own copy rather than importing the payroll one: this module covers
// a different status vocabulary (Tenant.status, Subscription.status, BillingRun.status), and
// cross-feature imports between components/features/* subfolders have no precedent in this
// codebase. Deliberately has no "use client" directive: pure/presentational, renders fine from
// both Server and Client Components.
const STATUS_STYLES: Record<string, string> = {
  // green — settled / final-good / currently-serving states
  ACTIVE: "bg-green-100 text-green-800",
  PROCESSED: "bg-green-100 text-green-800",
  // amber — in-flight / awaiting action / needs attention
  DRAFT: "bg-amber-100 text-amber-800",
  TRIALING: "bg-amber-100 text-amber-800",
  PAST_DUE: "bg-amber-100 text-amber-800",
  // red — terminated / suspended / undone
  SUSPENDED: "bg-red-100 text-red-800",
  CANCELLED: "bg-red-100 text-red-800",
  CANCELED: "bg-red-100 text-red-800",
  EXPIRED: "bg-red-100 text-red-800",
  // blue — final, locked-down state
  LOCKED: "bg-blue-100 text-blue-800",
  // zinc — neutral closed state
  INACTIVE: "bg-zinc-100 text-zinc-600",
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const className = STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-600";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{status}</span>;
}
