"use client"; // Error boundaries must be Client Components

// Route-segment error boundary (Next.js error.js convention) — catches unexpected runtime
// errors from StudentsListPage (e.g. a database error) and shows fallback UI instead of a blank
// crash. `unstable_retry` re-fetches and re-renders the segment in place, per this Next.js
// version's error.js (v16.2.0 added `unstable_retry`; see node_modules/next/dist/docs).
export default function StudentsListError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
        <h2 className="text-lg font-semibold text-red-800">Couldn&apos;t load students</h2>
        <p className="mt-1 text-sm text-red-700">
          Something went wrong while loading the student list.
          {error.digest ? ` (Reference: ${error.digest})` : ""}
        </p>
        <button
          onClick={() => unstable_retry()}
          className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
