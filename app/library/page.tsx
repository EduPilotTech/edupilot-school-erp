import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";

interface LibraryHubLink {
  href: string;
  label: string;
  description: string;
  permission: string;
}

const LINKS: LibraryHubLink[] = [
  { href: "/library/libraries", label: "Libraries", description: "Branches and their settings", permission: "library.manage" },
  { href: "/library/categories", label: "Book Categories", description: "Fiction, Biography, Reference, etc.", permission: "library.catalog.manage" },
  { href: "/library/authors", label: "Authors", description: "Author master data", permission: "library.catalog.manage" },
  { href: "/library/publishers", label: "Publishers", description: "Publisher master data", permission: "library.catalog.manage" },
  { href: "/library/books", label: "Books & Copies", description: "Catalog, accession numbers, QR/barcode labels", permission: "library.catalog.manage" },
  { href: "/library/racks", label: "Racks & Shelves", description: "Physical storage locations", permission: "library.inventory.manage" },
  { href: "/library/issue", label: "Issue Counter", description: "Check out a book to a member", permission: "library.circulation.manage" },
  { href: "/library/return", label: "Return Counter", description: "Return, renew, lost, damaged", permission: "library.circulation.manage" },
  { href: "/library/reservations", label: "Reservations", description: "Holds and the reservation queue", permission: "library.reservation.manage" },
  { href: "/library/fines", label: "Fine Management", description: "Generate fine invoices, waive fines", permission: "library.fine.manage" },
  { href: "/library/reports/inventory", label: "Inventory Report", description: "Copies per title, by status", permission: "library.report.view" },
  { href: "/library/reports/issue", label: "Issue Report", description: "Every book issued", permission: "library.report.view" },
  { href: "/library/reports/return", label: "Return Report", description: "Every book returned", permission: "library.report.view" },
  { href: "/library/reports/overdue", label: "Overdue Report", description: "Still-open issues past due", permission: "library.report.view" },
  { href: "/library/reports/fine", label: "Fine Report", description: "Every library fine invoice", permission: "library.report.view" },
  { href: "/library/reports/lost", label: "Lost Books", description: "Copies marked lost", permission: "library.report.view" },
  { href: "/library/reports/damaged", label: "Damaged Books", description: "Copies marked damaged", permission: "library.report.view" },
  { href: "/library/reports/most-borrowed", label: "Most Borrowed Books", description: "Top titles by issue count", permission: "library.report.view" },
  { href: "/library/reports/member-activity", label: "Member Activity", description: "One member's full circulation history", permission: "library.report.view" },
];

export default async function LibraryHubPage() {
  await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const visibleLinks = LINKS.filter((link) => can(authorization, link.permission));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Library Management</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Libraries, catalog, physical inventory, circulation, reservations, fines, and reports.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400"
          >
            <h2 className="text-base font-semibold text-zinc-900">{link.label}</h2>
            <p className="mt-1 text-sm text-zinc-500">{link.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
