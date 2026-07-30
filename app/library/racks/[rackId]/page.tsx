import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { getRack } from "@/modules/library/application/rack.service";
import { listShelvesByRack } from "@/modules/library/application/shelf.service";
import { ShelfManager } from "@/components/features/library/ShelfManager";

interface PageProps {
  params: Promise<{ rackId: string }>;
}

export default async function RackDetailPage({ params }: PageProps) {
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const canManage = can(authorization, "library.inventory.manage");
  const { rackId } = await params;

  const rack = await getRack(authContext.tenantId, rackId);
  if (!rack) notFound();

  const shelves = await listShelvesByRack(authContext.tenantId, rackId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">{rack.name} — Shelves</h1>
      <div className="mt-6">
        <ShelfManager rackId={rackId} items={shelves} canManage={canManage} />
      </div>
    </main>
  );
}
