// Instant loading state (Next.js loading.js convention) shown while StudentsListPage's data
// fetch (listStudents + the three academics read services) is in flight. A lightweight skeleton,
// not a spinner, so the table shape doesn't visually jump once real rows arrive.
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div className="h-8 w-32 animate-pulse rounded bg-zinc-200" />
        <div className="h-9 w-32 animate-pulse rounded-lg bg-zinc-200" />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-9 w-32 animate-pulse rounded-lg bg-zinc-200" />
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <div className="h-10 bg-zinc-50" />
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 border-t border-zinc-100 px-4 py-3">
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-28 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-16 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
    </main>
  );
}
