"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignRoleAction } from "../actions";

interface AssignRoleDialogProps {
  userId: string;
  availableRoles: { id: string; name: string }[];
}

// Client Component ("Dialogs" category) — assigning a role needs a role picker and immediate
// feedback (duplicate/cross-tenant errors from assignRoleAction), which a plain Link can't do.
export function AssignRoleDialog({ userId, availableRoles }: AssignRoleDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [roleId, setRoleId] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    if (!roleId) return;

    setIsPending(true);
    setError(null);

    const result = await assignRoleAction({ userId, roleId });

    setIsPending(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setIsOpen(false);
    setRoleId("");
    router.refresh();
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
      >
        Assign Role
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <select
          value={roleId}
          onChange={(event) => setRoleId(event.target.value)}
          className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
        >
          <option value="">Select a role…</option>
          {availableRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAssign}
          disabled={isPending || !roleId}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Assigning…" : "Assign"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          disabled={isPending}
          className="text-sm text-zinc-500 hover:underline disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
