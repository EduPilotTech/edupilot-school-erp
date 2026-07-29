import "server-only";
import { getReportCard } from "@/modules/examinations/application/get-report-card.service";
import { resolveGuardianForUserProfile, assertGuardianCanAccessStudent } from "./guardian-access.helpers";
import { recordParentActivity } from "./record-parent-activity.helpers";
import type { ReportCardDTO } from "@/modules/examinations/application/dto/report-card.dto";

export interface GetMyReportCardContext {
  tenantId: string;
  userProfileId: string;
}

// Report Card Download (requirement 8) — reuses get-report-card.service.ts (Phase 7) and the
// same ReportCardView/ReportCardPrintView components, just on a parent-facing route (Decision
// 11 — reuse the existing print/export stack).
export async function getMyReportCard(
  examId: string,
  studentId: string,
  context: GetMyReportCardContext
): Promise<ReportCardDTO> {
  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, studentId);

  const reportCard = await getReportCard(examId, studentId, { tenantId: context.tenantId });

  await recordParentActivity({
    tenantId: context.tenantId,
    guardianId: guardian.id,
    userProfileId: context.userProfileId,
    action: "VIEWED_REPORT_CARD",
    entityType: "Exam",
    entityId: examId,
  });

  return reportCard;
}
