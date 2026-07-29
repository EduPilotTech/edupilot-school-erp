import type { RankingRowDTO } from "@/modules/examinations/application/dto/ranking.dto";

interface RankingTableProps {
  rows: RankingRowDTO[];
}

export function RankingTable({ rows }: RankingTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">No results generated yet for this class and section.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Rank</th>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Admission #</th>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
            <th className="px-4 py-2 text-right font-medium text-zinc-500">Marks</th>
            <th className="px-4 py-2 text-right font-medium text-zinc-500">Percentage</th>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Grade</th>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {rows.map((row) => (
            <tr key={row.studentId}>
              <td className="px-4 py-2 text-zinc-900">{row.rank ?? "—"}</td>
              <td className="px-4 py-2 text-zinc-700">{row.admissionNumber}</td>
              <td className="px-4 py-2 text-zinc-900">{row.fullName}</td>
              <td className="px-4 py-2 text-right text-zinc-700">
                {row.totalMarksObtained}/{row.totalMaxMarks}
              </td>
              <td className="px-4 py-2 text-right text-zinc-700">{row.percentage.toFixed(1)}%</td>
              <td className="px-4 py-2 text-zinc-700">{row.overallGrade ?? "—"}</td>
              <td className="px-4 py-2 text-zinc-700">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
