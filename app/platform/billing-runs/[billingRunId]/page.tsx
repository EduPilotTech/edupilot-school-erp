import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getBillingRun } from "@/modules/billing/application/billing-run.service";
import { BillingRunDetail } from "@/components/features/platform/BillingRunDetail";

interface PlatformBillingRunDetailPageProps {
  params: Promise<{ billingRunId: string }>;
}

export default async function PlatformBillingRunDetailPage({ params }: PlatformBillingRunDetailPageProps) {
  const { billingRunId } = await params;
  await requireAuthContext();
  await requirePermission("platform.billing.manage");

  const run = await getBillingRun(billingRunId);
  if (!run) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/platform/billing-runs" className="text-sm text-blue-600 hover:underline">
        ← Billing Runs
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Billing Run — {run.billingPeriod}</h1>

      <div className="mt-6">
        <BillingRunDetail run={run} />
      </div>
    </main>
  );
}
