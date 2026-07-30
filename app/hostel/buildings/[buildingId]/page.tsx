import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { PrismaHostelBuildingRepository } from "@/modules/hostel/infrastructure/prisma-hostel-building.repository";
import { listHostelFloors } from "@/modules/hostel/application/list-hostel-floors.service";
import { listHostelWings } from "@/modules/hostel/application/list-hostel-wings.service";
import { HostelFloorManager } from "@/components/features/hostel/HostelFloorManager";
import { HostelWingManager } from "@/components/features/hostel/HostelWingManager";

interface BuildingDetailPageProps {
  params: Promise<{ buildingId: string }>;
}

export default async function BuildingDetailPage({ params }: BuildingDetailPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.manage");

  const { buildingId } = await params;
  const buildingRepository = new PrismaHostelBuildingRepository();
  const building = await buildingRepository.findById(authContext.tenantId, buildingId);
  if (!building) notFound();

  const [floors, wings] = await Promise.all([
    listHostelFloors({ tenantId: authContext.tenantId }, buildingId),
    listHostelWings({ tenantId: authContext.tenantId }, buildingId),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href={`/hostel/hostels/${building.hostelId}`} className="text-sm text-blue-600 hover:underline">
        ← Hostel
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
        {building.name} <span className="text-base font-normal text-zinc-500">({building.code})</span>
      </h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Floors</h2>
        <p className="mt-1 text-sm text-zinc-500">Open a floor to manage its rooms.</p>
        <div className="mt-3">
          <HostelFloorManager buildingId={buildingId} items={floors} canManage />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Wings</h2>
        <p className="mt-1 text-sm text-zinc-500">Optional grouping — a room may belong to a wing.</p>
        <div className="mt-3">
          <HostelWingManager buildingId={buildingId} items={wings} canManage />
        </div>
      </section>
    </main>
  );
}
