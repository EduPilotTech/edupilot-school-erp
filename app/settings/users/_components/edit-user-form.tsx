"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserProfileAction } from "../actions";

interface EditUserFormProps {
  userId: string;
  initialFullName: string;
  initialPhone: string;
  initialAvatarUrl: string;
}

// Client Component ("Forms" category) — needs pending/error state around the Server Action call.
// Deliberately has no email field — email is a synced cache of auth.users.email (Sprint 2), not
// editable through a plain profile edit, per updateUserProfileSchema's own design.
export function EditUserForm({
  userId,
  initialFullName,
  initialPhone,
  initialAvatarUrl,
}: EditUserFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const result = await updateUserProfileAction(userId, {
      fullName,
      phone: phone || null,
      avatarUrl: avatarUrl || null,
    });

    setIsPending(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    router.push(`/settings/users/${userId}`);
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
          Name
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
        <label htmlFor="phone" className="text-sm font-medium text-zinc-700">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="avatarUrl" className="text-sm font-medium text-zinc-700">
          Avatar URL
        </label>
        <input
          id="avatarUrl"
          name="avatarUrl"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
