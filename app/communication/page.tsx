import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";

interface CommunicationHubLink {
  href: string;
  label: string;
  description: string;
  permission: string;
}

const LINKS: CommunicationHubLink[] = [
  { href: "/communication/homework", label: "Homework", description: "Assign and view homework by class/section", permission: "communication.homework.view" },
  { href: "/communication/notices", label: "Notice Board", description: "Compose and publish notices / broadcasts", permission: "communication.notice.view" },
  { href: "/communication/calendar", label: "School Calendar", description: "Exams, PTMs, and events alongside holidays", permission: "communication.calendar.view" },
  { href: "/communication/messages", label: "Messages", description: "Conversations with parents", permission: "communication.message.view" },
  { href: "/settings/parents", label: "Parent Portal Accounts", description: "Grant guardians portal access", permission: "parent.account.link" },
];

export default async function CommunicationHubPage() {
  await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const visibleLinks = LINKS.filter((link) => can(authorization, link.permission));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Communication</h1>
      <p className="mt-1 text-sm text-zinc-500">Homework, notices, calendar, and parent messaging.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
