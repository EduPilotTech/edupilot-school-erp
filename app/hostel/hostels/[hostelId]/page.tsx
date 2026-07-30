import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getHostel } from "@/modules/hostel/application/list-hostels.service";
import { listHostelBuildings } from "@/modules/hostel/application/list-hostel-buildings.service";
import { HostelBuildingManager } from "@/components/features/hostel/HostelBuildingManager";

interface HostelDetailPageProps {
  params: Promise<{ hostelId: string }>;
}

export default async function HostelDetailPage({ params }: HostelDetailPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.manage");

  const { hostelId } = await params;
  const hostel = await getHostel(authContext.tenantId, hostelId);
  if (!hostel) notFound();

  const buildings = await listHostelBuildings({ tenantId: authContext.tenantId }, hostelId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/hostel/hostels" className="text-sm text-blue-600 hover:underline">
        ← Hostels
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
        {hostel.name} <span className="text-base font-normal text-zinc-500">({hostel.code})</span>
      </h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Buildings</h2>
        <div className="mt-3">
          <HostelBuildingManager hostelId={hostelId} items={buildings} canManage />
        </div>
      </section>

      <section className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link href={`/hostel/fee-rules?hostelId=${hostelId}`} className="text-blue-600 hover:underline">
          Manage fee rules for this hostel →
        </Link>
        <Link href={`/hostel/mess?hostelId=${hostelId}`} className="text-blue-600 hover:underline">
          Manage mess plans for this hostel →
        </Link>
        <Link href={`/hostel/reports/room-occupancy?hostelId=${hostelId}`} className="text-blue-600 hover:underline">
          View room occupancy →
        </Link>
      </section>
    </main>
  );
}
