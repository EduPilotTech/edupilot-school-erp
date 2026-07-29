"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { linkGuardianAccountAction } from "@/app/settings/parents/actions";
import type { GuardianEntity } from "@/modules/students/domain/guardian.entity";

interface GuardianLinkManagerProps {
  guardians: GuardianEntity[];
  search: string;
}

// Parent Account (requirement 1) — staff-side: search for a Guardian contact record and grant
// them a parent-portal account (Supabase invite -> UserProfile -> PARENT role ->
// Guardian.userProfileId link, all via link-guardian-account.service.ts).
export function GuardianLinkManager({ guardians, search }: GuardianLinkManagerProps) {
  const router = useRouter();
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleLink(guardian: GuardianEntity) {
    setLinkingId(guardian.id);
    setError(null);
    setMessage(null);
    try {
      const result = await linkGuardianAccountAction({ guardianId: guardian.id });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMessage(`Invitation sent to ${guardian.email ?? guardian.fullName}.`);
      router.refresh();
    } finally {
      setLinkingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">{message}</p>
      )}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Email</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Phone</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Portal Account</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {guardians.map((guardian) => (
              <tr key={guardian.id}>
                <td className="px-4 py-2 text-zinc-900">{guardian.fullName}</td>
                <td className="px-4 py-2 text-zinc-700">{guardian.email ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{guardian.phone ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{guardian.userProfileId ? "Linked" : "Not linked"}</td>
                <td className="px-4 py-2 text-right">
                  {!guardian.userProfileId && (
                    <button
                      type="button"
                      onClick={() => handleLink(guardian)}
                      disabled={linkingId === guardian.id || !guardian.email}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                      title={!guardian.email ? "This guardian has no email address on file." : undefined}
                    >
                      {linkingId === guardian.id ? "Sending…" : "Grant Portal Access"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {guardians.length === 0 && (
          <p className="p-4 text-sm text-zinc-500">
            {search ? "No guardians match your search." : "Search for a guardian by name, phone, or email."}
          </p>
        )}
      </div>
    </div>
  );
}
