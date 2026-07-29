import Link from "next/link";

interface PaginationLinksProps {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
}

function hrefFor(page: number, searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value === undefined) continue;
    params.set(key, Array.isArray(value) ? value[0] : value);
  }

  params.set("page", String(page));
  return `?${params.toString()}`;
}

// Pure presentational — plain <Link> navigation, no client-side state needed for pagination.
// Mirrors app/settings/users/_components/pagination-links.tsx exactly; duplicated rather than
// imported cross-route, matching each route's private `_components` colocation convention.
export function PaginationLinks({ page, totalPages, searchParams }: PaginationLinksProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="mt-6 flex items-center justify-between text-sm text-zinc-600">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={hrefFor(page - 1, searchParams)}
            className="rounded-lg border border-zinc-300 px-3 py-1 hover:border-zinc-400"
          >
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={hrefFor(page + 1, searchParams)}
            className="rounded-lg border border-zinc-300 px-3 py-1 hover:border-zinc-400"
          >
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
