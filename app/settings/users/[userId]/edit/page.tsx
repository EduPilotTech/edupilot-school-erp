import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { EditUserForm } from "../../_components/edit-user-form";

interface EditUserPageProps {
  params: Promise<{ userId: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { userId } = await params;
  const authContext = await requireAuthContext();
  await requirePermission("user.update");

  const detail = await getUserDetail(userId, { tenantId: authContext.tenantId });

  if (!detail || detail.profile.deletedAt) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Edit User</h1>
      <EditUserForm
        userId={detail.profile.id}
        initialFullName={detail.profile.fullName}
        initialPhone={detail.profile.phone ?? ""}
        initialAvatarUrl={detail.profile.avatarUrl ?? ""}
      />
    </main>
  );
}
