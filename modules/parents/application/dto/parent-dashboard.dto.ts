import type { MyChildDTO } from "./my-child.dto";
import type { HomeworkDTO } from "@/modules/communication/application/dto/homework.dto";
import type { NoticeDTO } from "@/modules/communication/application/dto/notice.dto";
import type { CalendarItemDTO } from "@/modules/communication/application/dto/calendar-event.dto";

export interface DashboardAttendanceSummary {
  presentCount: number;
  absentCount: number;
  totalDays: number;
  percentage: number;
}

export interface DashboardFeeSummary {
  totalOutstanding: number;
  overdueCount: number;
}

export interface DashboardLatestResult {
  examName: string;
  percentage: number;
  overallGrade: string | null;
}

// Decision 9 — one dashboard read composing every module this phase touches: student switcher
// (children), attendance, fees, results, homework, notices, upcoming events.
export interface ParentDashboardDTO {
  children: MyChildDTO[];
  selectedStudentId: string;
  attendanceSummary: DashboardAttendanceSummary | null;
  feeSummary: DashboardFeeSummary;
  latestResult: DashboardLatestResult | null;
  upcomingHomework: HomeworkDTO[];
  recentNotices: NoticeDTO[];
  upcomingEvents: CalendarItemDTO[];
  unreadNotificationCount: number;
}
