import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMyTransport } from "@/modules/parents/application/get-my-transport.service";

interface PageProps {
  params: Promise<{ studentId: string }>;
}

// Parent Portal Integration (Phase 10 Decision 10) — route, stop, vehicle, driver, and today's
// boarding status, reusing the same guardian-access authorization every other parent-facing page
// in this app uses.
export default async function ParentStudentTransportPage({ params }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("parent.transport.view");
  const { studentId } = await params;

  const transport = await getMyTransport(studentId, {
    tenantId: authContext.tenantId,
    userProfileId: authContext.userId,
  });

  if (!transport) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900">Transport</h1>
        <p className="mt-4 text-sm text-zinc-500">This student is not assigned to a transport route this session.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Transport</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Route <span className="font-medium text-zinc-900">{transport.routeName}</span> — Stop{" "}
        <span className="font-medium text-zinc-900">{transport.stopName}</span>
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-500">Pickup Time</h2>
          <p className="mt-1 text-lg font-semibold text-zinc-900">{transport.pickupTime ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-500">Drop Time</h2>
          <p className="mt-1 text-lg font-semibold text-zinc-900">{transport.dropTime ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-500">Vehicle</h2>
          <p className="mt-1 text-lg font-semibold text-zinc-900">{transport.vehicleRegistrationNumber ?? "Not assigned"}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-500">Driver</h2>
          <p className="mt-1 text-lg font-semibold text-zinc-900">{transport.driverName ?? "Not assigned"}</p>
          {transport.driverPhone && <p className="text-sm text-zinc-500">{transport.driverPhone}</p>}
        </div>
        {transport.helperName && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-medium text-zinc-500">Helper</h2>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{transport.helperName}</p>
          </div>
        )}
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-500">Assignment Status</h2>
          <p className="mt-1 text-lg font-semibold text-zinc-900">{transport.status.replaceAll("_", " ")}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-medium text-zinc-500">Today</h2>
        <div className="mt-2 flex gap-6 text-sm">
          <p>
            Pickup: <span className="font-medium text-zinc-900">{transport.todayPickupStatus ?? "Not marked yet"}</span>
          </p>
          <p>
            Drop: <span className="font-medium text-zinc-900">{transport.todayDropStatus ?? "Not marked yet"}</span>
          </p>
        </div>
      </div>
    </main>
  );
}
