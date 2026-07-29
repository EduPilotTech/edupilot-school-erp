interface EmptyStateProps {
  message: string;
}

// Pure presentational — the shared "this section has nothing to show yet" treatment, reused by
// Medical, Documents, and Activity Timeline (the sections this sprint has no backing data for).
export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
      {message}
    </div>
  );
}
