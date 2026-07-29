import "server-only";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { getCurrentEnrollmentForStudent } from "@/modules/students/application/list-current-enrollments.service";
import { getStudentAttendanceReport } from "@/modules/attendance/application/get-student-attendance-report.service";
import { getStudentProgressReport } from "@/modules/examinations/application/get-student-progress-report.service";
import { listOutstandingInvoicesForStudent } from "@/modules/fees/application/list-invoices.service";
import { listHomeworkForClass } from "@/modules/communication/application/list-homework.service";
import { listVisibleNotices } from "@/modules/communication/application/list-notices.service";
import { getSchoolCalendar } from "@/modules/communication/application/get-school-calendar.service";
import { countUnreadNotifications } from "@/modules/communication/application/list-notifications.service";
import { listMyChildren } from "./list-my-children.service";
import { assertGuardianCanAccessStudent, resolveGuardianForUserProfile } from "./guardian-access.helpers";
import type { ParentDashboardDTO } from "./dto/parent-dashboard.dto";

export interface GetParentDashboardContext {
  tenantId: string;
  userProfileId: string;
}

const RECENT_ATTENDANCE_DAYS = 30;
const UPCOMING_EVENT_DAYS = 30;
const MAX_LIST_ITEMS = 10;

function emptyDashboard(children: Awaited<ReturnType<typeof listMyChildren>>, unreadCount: number): ParentDashboardDTO {
  return {
    children,
    selectedStudentId: "",
    attendanceSummary: null,
    feeSummary: { totalOutstanding: 0, overdueCount: 0 },
    latestResult: null,
    upcomingHomework: [],
    recentNotices: [],
    upcomingEvents: [],
    unreadNotificationCount: unreadCount,
  };
}

// Decision 9 — the single dashboard read a parent's home page renders: student switcher,
// attendance, fees, results, homework, notices, and upcoming events, all composed from existing
// module read services (no duplicated logic).
export async function getParentDashboard(
  requestedStudentId: string | undefined,
  context: GetParentDashboardContext
): Promise<ParentDashboardDTO> {
  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  const children = await listMyChildren({ tenantId: context.tenantId, userProfileId: context.userProfileId });
  const unreadNotificationCount = await countUnreadNotifications(context.tenantId, context.userProfileId);

  const selectedStudentId =
    requestedStudentId && children.some((child) => child.studentId === requestedStudentId)
      ? requestedStudentId
      : children[0]?.studentId;

  if (!selectedStudentId) {
    return emptyDashboard(children, unreadNotificationCount);
  }

  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, selectedStudentId);

  const sessions = await listActiveAcademicSessions({ tenantId: context.tenantId });
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0];

  const now = new Date();
  const attendanceWindowStart = new Date(now.getTime() - RECENT_ATTENDANCE_DAYS * 24 * 60 * 60 * 1000);
  const upcomingWindowEnd = new Date(now.getTime() + UPCOMING_EVENT_DAYS * 24 * 60 * 60 * 1000);

  const [attendance, invoices, progress] = await Promise.all([
    getStudentAttendanceReport(
      { studentId: selectedStudentId, startDate: attendanceWindowStart, endDate: now },
      { tenantId: context.tenantId }
    ),
    listOutstandingInvoicesForStudent(context.tenantId, selectedStudentId),
    getStudentProgressReport(selectedStudentId, { tenantId: context.tenantId }),
  ]);

  let upcomingHomework: ParentDashboardDTO["upcomingHomework"] = [];
  let recentNotices: ParentDashboardDTO["recentNotices"] = [];
  let upcomingEvents: ParentDashboardDTO["upcomingEvents"] = [];

  if (currentSession) {
    const enrollment = await getCurrentEnrollmentForStudent(selectedStudentId, currentSession.id, {
      tenantId: context.tenantId,
    });
    if (enrollment) {
      const [homework, notices, calendar] = await Promise.all([
        listHomeworkForClass(context.tenantId, enrollment.classId, enrollment.sectionId),
        listVisibleNotices(context.tenantId, currentSession.id, enrollment.classId, enrollment.sectionId),
        getSchoolCalendar(context.tenantId, currentSession.id),
      ]);
      upcomingHomework = homework.filter((item) => new Date(item.dueDate) >= now).slice(0, MAX_LIST_ITEMS);
      recentNotices = notices.slice(0, MAX_LIST_ITEMS);
      upcomingEvents = calendar
        .filter((item) => {
          const start = new Date(item.startDate);
          return start >= now && start <= upcomingWindowEnd;
        })
        .slice(0, MAX_LIST_ITEMS);
    }
  }

  const totalOutstanding = Math.round(invoices.reduce((sum, invoice) => sum + invoice.balance, 0) * 100) / 100;
  const overdueCount = invoices.filter((invoice) => invoice.status === "OVERDUE").length;

  const presentCount = attendance.entries.filter((entry) => entry.status === "PRESENT").length;
  const totalDays = attendance.entries.length;

  const latestEntry = progress.entries.at(-1);

  return {
    children,
    selectedStudentId,
    attendanceSummary:
      totalDays > 0
        ? {
            presentCount,
            absentCount: totalDays - presentCount,
            totalDays,
            percentage: Math.round((presentCount / totalDays) * 1000) / 10,
          }
        : null,
    feeSummary: { totalOutstanding, overdueCount },
    latestResult: latestEntry
      ? { examName: latestEntry.examName, percentage: latestEntry.percentage, overallGrade: latestEntry.overallGrade }
      : null,
    upcomingHomework,
    recentNotices,
    upcomingEvents,
    unreadNotificationCount,
  };
}
