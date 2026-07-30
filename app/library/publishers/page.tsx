import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listPublishers } from "@/modules/library/application/publisher.service";
import { PublisherManager } from "@/components/features/library/PublisherManager";

export default async function PublishersPage() {
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const canManage = can(authorization, "library.catalog.manage");

  const publishers = await listPublishers({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Publishers</h1>
      <div className="mt-6">
        <PublisherManager items={publishers} canManage={canManage} />
      </div>
    </main>
  );
}
