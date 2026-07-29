import type { ReportCardDTO } from "@/modules/examinations/application/dto/report-card.dto";

interface ReportCardViewProps {
  reportCard: ReportCardDTO;
}

// Pure, presentational — no ref, no "use client" (only ReportCardPrintView, which wraps this,
// touches html-to-image), matching TimetablePrintGrid's own split. `id="report-card-print-area"`
// is what report-card-print.css's @media print rule targets.
export function ReportCardView({ reportCard }: ReportCardViewProps) {
  return (
    <div id="report-card-print-area" className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{reportCard.fullName}</h2>
          <p className="text-sm text-zinc-500">
            Admission #{reportCard.admissionNumber} · {reportCard.className} {reportCard.sectionName}
            {reportCard.rollNumber ? ` · Roll #${reportCard.rollNumber}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-900">{reportCard.examName}</p>
          <p className="text-xs text-zinc-500">Report Card</p>
        </div>
      </div>

      <table className="mt-4 min-w-full divide-y divide-zinc-200 border border-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="border border-zinc-200 px-3 py-2 text-left font-medium text-zinc-500">Subject</th>
            <th className="border border-zinc-200 px-3 py-2 text-right font-medium text-zinc-500">Marks Obtained</th>
            <th className="border border-zinc-200 px-3 py-2 text-right font-medium text-zinc-500">Max Marks</th>
            <th className="border border-zinc-200 px-3 py-2 text-right font-medium text-zinc-500">Passing Marks</th>
          </tr>
        </thead>
        <tbody>
          {reportCard.subjects.map((subject) => (
            <tr key={subject.subjectName}>
              <td className="border border-zinc-200 px-3 py-2 text-zinc-900">{subject.subjectName}</td>
              <td className="border border-zinc-200 px-3 py-2 text-right text-zinc-700">
                {subject.isAbsent ? "Absent" : (subject.marksObtained ?? "—")}
              </td>
              <td className="border border-zinc-200 px-3 py-2 text-right text-zinc-700">{subject.maxMarks}</td>
              <td className="border border-zinc-200 px-3 py-2 text-right text-zinc-700">{subject.passingMarks}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500">Total</p>
          <p className="text-sm font-medium text-zinc-900">
            {reportCard.totalMarksObtained}/{reportCard.totalMaxMarks}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500">Percentage</p>
          <p className="text-sm font-medium text-zinc-900">{reportCard.percentage.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500">Grade</p>
          <p className="text-sm font-medium text-zinc-900">{reportCard.overallGrade ?? "—"}</p>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500">Rank</p>
          <p className="text-sm font-medium text-zinc-900">{reportCard.rank ?? "—"}</p>
        </div>
      </div>

      <p className="mt-3 text-sm font-medium text-zinc-900">
        Result: <span className={reportCard.status === "PASS" ? "text-green-700" : "text-red-700"}>{reportCard.status}</span>
      </p>

      {reportCard.attendance && (
        <div className="mt-4 border-t border-zinc-200 pt-4">
          <p className="text-xs text-zinc-500">Attendance (this academic session)</p>
          <p className="mt-1 text-sm text-zinc-700">
            Present: {reportCard.attendance.present} · Absent: {reportCard.attendance.absent} · Late:{" "}
            {reportCard.attendance.late} · Half Day: {reportCard.attendance.halfDay} · Leave:{" "}
            {reportCard.attendance.leave} · Total Marked: {reportCard.attendance.totalMarked}
          </p>
        </div>
      )}
    </div>
  );
}
