import Link from "next/link";
import "./report-card-print.css";
import { requireAuthContext, getCurrentSchool } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listExams } from "@/modules/examinations/application/list-exams.service";
import { listStudents } from "@/modules/students/application/list-students.service";
import { getReportCard } from "@/modules/examinations/application/get-report-card.service";
import { getStudentProgressReport } from "@/modules/examinations/application/get-student-progress-report.service";
import { getSchoolBranding } from "@/modules/branding/application/get-school-branding.service";
import { ReportCardPrintView } from "@/components/features/examinations/ReportCardPrintView";
import { ProgressReportTable } from "@/components/features/examinations/ProgressReportTable";

interface ReportCardsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type ReportType = "reportcard" | "progress";
const TABS: { type: ReportType; label: string }[] = [
  { type: "reportcard", label: "Report Card" },
  { type: "progress", label: "Progress Report" },
];

export default async function ReportCardsPage({ searchParams }: ReportCardsPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("result.view");
  const authorization = await getAuthorizationContext();
  const canPrint = can(authorization, "reportcard.print");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const type: ReportType = first(params.type) === "progress" ? "progress" : "reportcard";
  const academicSessionId = first(params.academicSessionId) ?? "";
  const examId = first(params.examId) ?? "";
  const search = first(params.search) ?? "";
  const studentId = first(params.studentId) ?? "";

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const exams =
    type === "reportcard" && academicSessionId
      ? await listExams(academicSessionId, { tenantId: authContext.tenantId })
      : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="timetable-screen-only flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Report Cards</h1>
          <p className="mt-1 text-sm text-zinc-500">Printable report cards and student progress reports.</p>
        </div>
        <Link href="/examinations" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400">
          Examinations
        </Link>
      </div>

      <div className="timetable-screen-only mt-6 flex flex-wrap gap-2 border-b border-zinc-200">
        {TABS.map((tab) => (
          <Link
            key={tab.type}
            href={`/examinations/report-cards?type=${tab.type}`}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium ${
              type === tab.type ? "border-b-2 border-blue-600 text-blue-700" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {type === "reportcard" && (
        <form method="get" className="timetable-screen-only mt-6 flex flex-wrap items-end gap-3">
          <input type="hidden" name="type" value="reportcard" />
          <div className="flex flex-col gap-1">
            <label htmlFor="academicSessionId" className="text-xs font-medium text-zinc-500">
              Academic Session
            </label>
            <select
              id="academicSessionId"
              name="academicSessionId"
              defaultValue={academicSessionId}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              <option value="">Select session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.sessionName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="examId" className="text-xs font-medium text-zinc-500">
              Exam
            </label>
            <select
              id="examId"
              name="examId"
              defaultValue={examId}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              <option value="">Select exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="search" className="text-xs font-medium text-zinc-500">
              Search Student
            </label>
            <input
              id="search"
              name="search"
              defaultValue={search}
              placeholder="Admission # or name"
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400">
            Search
          </button>
        </form>
      )}

      {type === "progress" && (
        <form method="get" className="timetable-screen-only mt-6 flex flex-wrap items-end gap-3">
          <input type="hidden" name="type" value="progress" />
          <div className="flex flex-col gap-1">
            <label htmlFor="search-progress" className="text-xs font-medium text-zinc-500">
              Search Student
            </label>
            <input
              id="search-progress"
              name="search"
              defaultValue={search}
              placeholder="Admission # or name"
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400">
            Search
          </button>
        </form>
      )}

      <div className="mt-8">
        {studentId && type === "reportcard" && examId ? (
          <ReportCardResult examId={examId} studentId={studentId} tenantId={authContext.tenantId} canPrint={canPrint} />
        ) : studentId && type === "progress" ? (
          <ProgressReportTable report={await getStudentProgressReport(studentId, { tenantId: authContext.tenantId })} />
        ) : search ? (
          <StudentSearchResults search={search} type={type} tenantId={authContext.tenantId} examId={examId} academicSessionId={academicSessionId} />
        ) : (
          <p className="timetable-screen-only text-sm text-zinc-500">
            {type === "reportcard" ? "Choose a session and exam, then search for a student." : "Search for a student."}
          </p>
        )}
      </div>
    </main>
  );
}

async function ReportCardResult({
  examId,
  studentId,
  tenantId,
  canPrint,
}: {
  examId: string;
  studentId: string;
  tenantId: string;
  canPrint: boolean;
}) {
  const reportCard = await getReportCard(examId, studentId, { tenantId }).catch(() => null);
  if (!reportCard) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
        No result found for this student and exam — results may not be generated yet.
      </p>
    );
  }
  const school = await getCurrentSchool();
  const branding = await getSchoolBranding({ tenantId, school });
  return (
    <ReportCardPrintView
      reportCard={reportCard}
      canPrint={canPrint}
      branding={{
        logoUrl: branding.logoUrl,
        themeColor: branding.themeColor,
        signatureUrl: branding.signatureUrl,
        sealUrl: branding.sealUrl,
        footerText: branding.footerText,
      }}
    />
  );
}

async function StudentSearchResults({
  search,
  type,
  tenantId,
  examId,
  academicSessionId,
}: {
  search: string;
  type: ReportType;
  tenantId: string;
  examId: string;
  academicSessionId: string;
}) {
  const results = await listStudents({ search, page: 1, pageSize: 10 }, { tenantId });
  if (results.items.length === 0) {
    return <p className="text-sm text-zinc-500">No students matched &quot;{search}&quot;.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
      {results.items.map((student) => (
        <li key={student.id}>
          <Link
            href={`/examinations/report-cards?type=${type}&studentId=${student.id}&examId=${examId}&academicSessionId=${academicSessionId}`}
            className="flex items-center justify-between px-4 py-2 text-sm hover:bg-zinc-50"
          >
            <span className="text-zinc-900">
              {student.firstName} {student.lastName}
            </span>
            <span className="text-zinc-500">{student.admissionNumber}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
