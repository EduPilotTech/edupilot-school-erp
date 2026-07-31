// No shared Badge primitive exists in components/ui yet (checked before building this) — a small
// rounded-full span with status-appropriate color, reused across every Payroll list/detail screen
// so the color convention stays in one place. Deliberately has no "use client" directive: it is
// pure/presentational and renders fine from both Server and Client Components.
const STATUS_STYLES: Record<string, string> = {
  // green — settled / final-good states
  PAID: "bg-green-100 text-green-800",
  LOCKED: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-100 text-green-800",
  ACTIVE: "bg-green-100 text-green-800",
  // amber — in-flight / awaiting action
  DRAFT: "bg-amber-100 text-amber-800",
  PENDING: "bg-amber-100 text-amber-800",
  // red — terminated / undone
  CANCELLED: "bg-red-100 text-red-800",
  REVERSED: "bg-red-100 text-red-800",
  // blue — generated but not yet final
  PROCESSED: "bg-blue-100 text-blue-800",
  GENERATED: "bg-blue-100 text-blue-800",
  // zinc — neutral closed state
  CLOSED: "bg-zinc-100 text-zinc-600",
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const className = STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-600";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{status}</span>
  );
}
