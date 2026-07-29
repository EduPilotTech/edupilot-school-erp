// Instant loading state (Next.js loading.js convention) shown while getStudentProfile's single
// query is in flight.
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />

      <div className="mt-6 flex flex-col gap-6">
        <div className="h-40 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100"
            />
          ))}
        </div>
        <div className="h-56 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100" />
        <div className="h-40 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100" />
      </div>
    </main>
  );
}
