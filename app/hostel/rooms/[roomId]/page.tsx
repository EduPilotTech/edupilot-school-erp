import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getHostelRoom } from "@/modules/hostel/application/list-hostel-rooms.service";
import { listHostelBedsByRoom } from "@/modules/hostel/application/list-hostel-beds.service";
import { HostelBedManager } from "@/components/features/hostel/HostelBedManager";

interface RoomDetailPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.bed.manage");

  const { roomId } = await params;
  const room = await getHostelRoom(authContext.tenantId, roomId);
  if (!room) notFound();

  const beds = await listHostelBedsByRoom({ tenantId: authContext.tenantId }, roomId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href={`/hostel/floors/${room.floorId}`} className="text-sm text-blue-600 hover:underline">
        ← Floor
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
        Room {room.roomNumber} <span className="text-base font-normal text-zinc-500">({room.roomType}, capacity {room.capacity})</span>
      </h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Beds</h2>
        <div className="mt-3">
          <HostelBedManager roomId={roomId} items={beds} canManage />
        </div>
      </section>
    </main>
  );
}
