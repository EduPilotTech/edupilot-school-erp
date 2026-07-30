import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { PrismaHostelFloorRepository } from "@/modules/hostel/infrastructure/prisma-hostel-floor.repository";
import { listHostelRoomsByFloor } from "@/modules/hostel/application/list-hostel-rooms.service";
import { listHostelWings } from "@/modules/hostel/application/list-hostel-wings.service";
import { HostelRoomManager } from "@/components/features/hostel/HostelRoomManager";

interface FloorDetailPageProps {
  params: Promise<{ floorId: string }>;
}

export default async function FloorDetailPage({ params }: FloorDetailPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.room.manage");

  const { floorId } = await params;
  const floorRepository = new PrismaHostelFloorRepository();
  const floor = await floorRepository.findById(authContext.tenantId, floorId);
  if (!floor) notFound();

  const [rooms, wings] = await Promise.all([
    listHostelRoomsByFloor({ tenantId: authContext.tenantId }, floorId),
    listHostelWings({ tenantId: authContext.tenantId }, floor.buildingId),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href={`/hostel/buildings/${floor.buildingId}`} className="text-sm text-blue-600 hover:underline">
        ← Building
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{floor.name}</h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Rooms</h2>
        <p className="mt-1 text-sm text-zinc-500">Open a room to manage its beds.</p>
        <div className="mt-3">
          <HostelRoomManager floorId={floorId} items={rooms} wings={wings} canManage />
        </div>
      </section>
    </main>
  );
}
