import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getNotificationTemplate } from "@/modules/communication/application/notification-template.service";
import { NotificationTemplateEditForm } from "@/components/features/notifications/NotificationTemplateEditForm";

interface EditTemplatePageProps {
  params: Promise<{ templateId: string }>;
}

export default async function EditNotificationTemplatePage({ params }: EditTemplatePageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("template.manage");

  const { templateId } = await params;
  const template = await getNotificationTemplate(authContext.tenantId, templateId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/templates" className="text-sm text-blue-600 hover:underline">
        ← Notification Templates
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Edit Template</h1>
      <p className="mt-1 text-sm text-zinc-500">Update the subject, message, variables, or active status.</p>

      <div className="mt-6">
        <NotificationTemplateEditForm template={template} />
      </div>
    </main>
  );
}
