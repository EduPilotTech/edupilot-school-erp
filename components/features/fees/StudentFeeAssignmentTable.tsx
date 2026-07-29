"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignStudentFeeAction } from "@/app/fees/setup/actions";
import type { FeeStructureDTO } from "@/modules/fees/application/dto/fee-structure.dto";
import type { InstallmentPlanDTO } from "@/modules/fees/application/dto/installment-plan.dto";
import type { StudentFeeAssignmentDTO } from "@/modules/fees/application/dto/student-fee-assignment.dto";

interface StudentRow {
  id: string;
  admissionNumber: string;
  fullName: string;
  currentAssignment: StudentFeeAssignmentDTO | null;
}

interface StudentFeeAssignmentTableProps {
  academicSessionId: string;
  students: StudentRow[];
  structures: FeeStructureDTO[];
  installmentPlans: InstallmentPlanDTO[];
  canManage: boolean;
}

// Binds a student to a FeeStructure (+ optional InstallmentPlan) for the session — upsert on the
// natural key, so re-assigning updates the existing row (see assignStudentFee's own comment).
export function StudentFeeAssignmentTable({
  academicSessionId,
  students,
  structures,
  installmentPlans,
  canManage,
}: StudentFeeAssignmentTableProps) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, { feeStructureId: string; installmentPlanId: string }>>(() =>
    Object.fromEntries(
      students.map((student) => [
        student.id,
        {
          feeStructureId: student.currentAssignment?.feeStructureId ?? structures[0]?.id ?? "",
          installmentPlanId: student.currentAssignment?.installmentPlanId ?? "",
        },
      ])
    )
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign(studentId: string) {
    setSavingId(studentId);
    setError(null);
    try {
      const draft = drafts[studentId];
      const result = await assignStudentFeeAction({
        studentId,
        academicSessionId,
        feeStructureId: draft.feeStructureId,
        installmentPlanId: draft.installmentPlanId || undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  if (students.length === 0) {
    return <p className="text-sm text-zinc-500">Search for a student by admission number or name.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Admission #</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Fee Structure</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Installment Plan</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {students.map((student) => {
              const draft = drafts[student.id];
              return (
                <tr key={student.id}>
                  <td className="px-4 py-2 text-zinc-700">{student.admissionNumber}</td>
                  <td className="px-4 py-2 text-zinc-900">{student.fullName}</td>
                  <td className="px-4 py-2">
                    <select
                      value={draft.feeStructureId}
                      disabled={!canManage}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [student.id]: { ...prev[student.id], feeStructureId: e.target.value },
                        }))
                      }
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                    >
                      {structures.map((structure) => (
                        <option key={structure.id} value={structure.id}>
                          {structure.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={draft.installmentPlanId}
                      disabled={!canManage}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [student.id]: { ...prev[student.id], installmentPlanId: e.target.value },
                        }))
                      }
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                    >
                      <option value="">None</option>
                      {installmentPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  {canManage && (
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleAssign(student.id)}
                        disabled={savingId === student.id || !draft.feeStructureId}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === student.id ? "Saving…" : "Assign"}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
