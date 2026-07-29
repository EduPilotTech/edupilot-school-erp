import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getComplianceAlerts } from "@/modules/transport/application/get-compliance-alerts.service";

// Compliance Alerts (Phase 10 requirement 12/9) — expired or soon-to-expire vehicle/driver
// documents, tracked via plain expiry-date fields only (Decision 6, no document upload).
export default async function ComplianceAlertsPage() {
  const authContext = await requireAuthContext();
  await requirePermission("transport.report.view");

  const alerts = await getComplianceAlerts(authContext.tenantId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Compliance Alerts</h1>
      <p className="mt-1 text-sm text-zinc-500">Vehicle and driver documents expired or expiring within 30 days.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Entity</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Field</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Expiry Date</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {alerts.map((alert) => (
              <tr key={`${alert.entityId}-${alert.field}`}>
                <td className="px-4 py-2 font-medium text-zinc-900">
                  {alert.label} <span className="text-xs text-zinc-400">({alert.entityType})</span>
                </td>
                <td className="px-4 py-2 text-zinc-700">{alert.field}</td>
                <td className="px-4 py-2 text-zinc-700">{alert.expiryDate}</td>
                <td className="px-4 py-2">
                  {alert.isExpired ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Expired {Math.abs(alert.daysRemaining)}d ago
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Expires in {alert.daysRemaining}d
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {alerts.length === 0 && <p className="p-4 text-sm text-zinc-500">No compliance alerts.</p>}
      </div>
    </main>
  );
}
