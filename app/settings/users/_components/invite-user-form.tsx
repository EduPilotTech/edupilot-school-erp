"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteUserAction, assignRoleAction } from "../actions";

interface InviteUserFormProps {
  roles: { id: string; name: string }[];
}

// Client Component — needs local state for pending/error display, per this step's "Client
// Components only for ... Forms" rule.
//
// "Initial Role" composes two existing actions rather than adding new business logic:
// inviteUser (Sprint 3 — Step 2) does not itself assign a role at invite time — that was
// explicitly deferred until assignRole existed (Step 3). Now that it does, this form calls
// inviteUserAction, and only if a role was selected and the invite succeeded, follows up with
// assignRoleAction for the newly created user id. Both actions are used exactly as built; no
// service was changed to make this work.
export function InviteUserForm({ roles }: InviteUserFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const inviteResult = await inviteUserAction({ email, fullName });

    if (!inviteResult.success) {
      setIsPending(false);
      setError(inviteResult.error.message);
      return;
    }

    if (roleId) {
      const roleResult = await assignRoleAction({ userId: inviteResult.data.id, roleId });

      if (!roleResult.success) {
        setIsPending(false);
        setError(`Invitation sent, but the role could not be assigned: ${roleResult.error.message}`);
        return;
      }
    }

    setIsPending(false);
    router.push("/settings/users");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="fullName" className="text-sm font-medium text-zinc-700">
          Full Name
        </label>
        <input
          id="fullName"
          name="fullName"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="roleId" className="text-sm font-medium text-zinc-700">
          Initial Role
        </label>
        <select
          id="roleId"
          name="roleId"
          value={roleId}
          onChange={(event) => setRoleId(event.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">No role yet</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Sending invitation…" : "Send Invitation"}
      </button>
    </form>
  );
}
