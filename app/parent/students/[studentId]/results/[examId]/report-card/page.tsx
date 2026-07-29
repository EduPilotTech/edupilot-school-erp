import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { getMyReportCard } from "@/modules/parents/application/get-my-report-card.service";
import { ReportCardPrintView } from "@/components/features/examinations/ReportCardPrintView";
import "@/app/examinations/report-cards/report-card-print.css";

interface PageProps {
  params: Promise<{ studentId: string; examId: string }>;
}

// Report Card Download (requirement 8) — reuses ReportCardPrintView / the existing print/export
// stack verbatim (Decision 11), just on a parent-facing, guardian-gated route.
export default async function ParentReportCardPage({ params }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("parent.reportcard.print");
  const authorization = await getAuthorizationContext();
  const { studentId, examId } = await params;

  const reportCard = await getMyReportCard(examId, studentId, {
    tenantId: authContext.tenantId,
    userProfileId: authContext.userId,
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <ReportCardPrintView reportCard={reportCard} canPrint={can(authorization, "parent.reportcard.print")} />
    </main>
  );
}
