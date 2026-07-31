"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignSalaryAction } from "@/app/payroll/actions";
import type { EmployeeSalaryAssignmentDTO } from "@/modules/payroll/application/dto/employee-salary-assignment.dto";
import type { SalaryStructureDTO } from "@/modules/payroll/application/dto/salary-structure.dto";

interface SalaryAssignmentManagerProps {
  employeeId: string;
  // Every structure at the school (active and inactive) — needed so name lookups for the
  // increment history resolve even for a structure that has since been deactivated. The "Assign
  // New Salary" dropdown itself narrows this down to active structures only.
  structures: SalaryStructureDTO[];
  currentAssignment: EmployeeSalaryAssignmentDTO | null;
  history: EmployeeSalaryAssignmentDTO[];
  canManage: boolean;
}

function structureName(structures: SalaryStructureDTO[], id: string): string {
  return structures.find((structure) => structure.id === id)?.name ?? id;
}

export function SalaryAssignmentManager({
  employeeId,
  structures,
  currentAssignment,
  history,
  canManage,
}: SalaryAssignmentManagerProps) {
  const router = useRouter();
  const assignableStructures = structures.filter((structure) => structure.isActive);
  const [salaryStructureId, setSalaryStructureId] = useState(assignableStructures[0]?.id ?? "");
  const [basicSalary, setBasicSalary] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await assignSalaryAction({
        employeeId,
        salaryStructureId,
        basicSalary: Number(basicSalary),
        effectiveFrom,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setBasicSalary("");
      setEffectiveFrom("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Current Salary</h2>
        {currentAssignment ? (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-zinc-500">Structure</dt>
              <dd className="text-zinc-900">{structureName(structures, currentAssignment.salaryStructureId)}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Basic Salary</dt>
              <dd className="text-zinc-900">₹{currentAssignment.basicSalary.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Effective From</dt>
              <dd className="text-zinc-900">{currentAssignment.effectiveFrom}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Effective To</dt>
              <dd className="text-zinc-900">{currentAssignment.effectiveTo ?? "Present"}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">This employee has no salary assignment yet.</p>
        )}
      </div>

      {canManage && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Assign New Salary</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="assign-structure" className="text-xs font-medium text-zinc-500">
                Salary Structure
              </label>
              <select
                id="assign-structure"
                value={salaryStructureId}
                onChange={(e) => setSalaryStructureId(e.target.value)}
                className="w-52 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              >
                {assignableStructures.map((structure) => (
                  <option key={structure.id} value={structure.id}>
                    {structure.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="assign-basic" className="text-xs font-medium text-zinc-500">
                Basic Salary (₹)
              </label>
              <input
                id="assign-basic"
                type="number"
                min={0}
                step="0.01"
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
                className="w-32 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="assign-effective-from" className="text-xs font-medium text-zinc-500">
                Effective From
              </label>
              <input
                id="assign-effective-from"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleAssign}
              disabled={isSubmitting || !salaryStructureId || !basicSalary || !effectiveFrom}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Assigning…" : "Assign Salary"}
            </button>
          </div>
          {assignableStructures.length === 0 && (
            <p className="mt-3 text-sm text-amber-700">No active salary structures. Create one first.</p>
          )}
          {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">Increment History</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Structure</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Basic Salary</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Effective From</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Effective To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {history.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-4 py-2 text-zinc-900">{structureName(structures, assignment.salaryStructureId)}</td>
                  <td className="px-4 py-2 text-zinc-700">₹{assignment.basicSalary.toFixed(2)}</td>
                  <td className="px-4 py-2 text-zinc-700">{assignment.effectiveFrom}</td>
                  <td className="px-4 py-2 text-zinc-700">{assignment.effectiveTo ?? "Present"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && <p className="p-4 text-sm text-zinc-500">No salary history yet.</p>}
        </div>
      </div>
    </div>
  );
}
