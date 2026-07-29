import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listMyChildren } from "@/modules/parents/application/list-my-children.service";
import { NewMessageForm } from "@/components/features/parents/NewMessageForm";

export default async function NewMessagePage() {
  const authContext = await requireAuthContext();
  await requirePermission("parent.message.send");

  const children = await listMyChildren({ tenantId: authContext.tenantId, userProfileId: authContext.userId });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">New Message</h1>
      <div className="mt-6">
        <NewMessageForm myChildren={children.map((child) => ({ studentId: child.studentId, fullName: child.fullName }))} />
      </div>
    </main>
  );
}
