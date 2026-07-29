import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { getRoute } from "@/modules/transport/application/get-route.service";
import { listRouteStops } from "@/modules/transport/application/list-route-stops.service";
import { getVehicleAssignmentForRoute } from "@/modules/transport/application/list-vehicle-assignments.service";
import { listVehicles } from "@/modules/transport/application/list-vehicles.service";
import { listDrivers } from "@/modules/transport/application/list-drivers.service";
import { listHelpers } from "@/modules/transport/application/list-helpers.service";
import { StopManager } from "@/components/features/transport/StopManager";
import { VehicleAssignmentPanel } from "@/components/features/transport/VehicleAssignmentPanel";

interface RouteDetailPageProps {
  params: Promise<{ routeId: string }>;
}

export default async function RouteDetailPage({ params }: RouteDetailPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("transport.route.manage");

  const { routeId } = await params;
  const route = await getRoute(authContext.tenantId, routeId);
  if (!route) notFound();

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0];

  const [stops, assignment, vehicles, drivers, helpers] = await Promise.all([
    listRouteStops({ tenantId: authContext.tenantId }, routeId),
    currentSession
      ? getVehicleAssignmentForRoute({ tenantId: authContext.tenantId }, routeId, currentSession.id)
      : null,
    listVehicles({ tenantId: authContext.tenantId }, { status: "ACTIVE" }),
    listDrivers({ tenantId: authContext.tenantId }, { isActive: true }),
    listHelpers({ tenantId: authContext.tenantId }, { isActive: true }),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/transport/routes" className="text-sm text-blue-600 hover:underline">
        ← Routes
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
        {route.name} <span className="text-base font-normal text-zinc-500">({route.code})</span>
      </h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Stops</h2>
        <div className="mt-3">
          <StopManager routeId={routeId} items={stops} canManage />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Vehicle Assignment</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {currentSession ? `Current session: ${currentSession.sessionName}` : "No active academic session."}
        </p>
        {currentSession && (
          <div className="mt-3">
            <VehicleAssignmentPanel
              routeId={routeId}
              academicSessionId={currentSession.id}
              current={assignment}
              vehicles={vehicles}
              drivers={drivers}
              helpers={helpers}
              canManage
            />
          </div>
        )}
      </section>

      <section className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link href={`/transport/fee-rules?routeId=${routeId}`} className="text-blue-600 hover:underline">
          Manage fee rule for this route →
        </Link>
        <Link href={`/transport/reports/students?routeId=${routeId}`} className="text-blue-600 hover:underline">
          View student list for this route →
        </Link>
      </section>
    </main>
  );
}
