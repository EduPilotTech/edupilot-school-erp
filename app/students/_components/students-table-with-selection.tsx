"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StudentStatusBadge } from "./student-status-badge";
import type { StudentListItemEntity } from "@/modules/students/domain/student.entity";

interface StudentsTableWithSelectionProps {
  items: StudentListItemEntity[];
  canPrintIdCards: boolean;
}

// Sprint 4.9 — Batch Print entry point. The table itself stays a straightforward render of
// server-fetched `items` (no client-side data fetching); only the checkbox selection state is
// client-side, which is why this is a Client Component wrapping otherwise-static rows rather
// than the whole app/students/page.tsx becoming one. Selection is intentionally scoped to the
// current page of results — it doesn't persist across pagination, keeping this simple rather
// than adding cross-page selection state nothing asked for.
export function StudentsTableWithSelection({ items, canPrintIdCards }: StudentsTableWithSelectionProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => (prev.size === items.length ? new Set() : new Set(items.map((item) => item.id))));
  }

  function handlePrintSelected() {
    router.push(`/students/id-cards?ids=${Array.from(selectedIds).join(",")}`);
  }

  return (
    <div className="flex flex-col gap-3">
      {canPrintIdCards && selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm">
          <span className="text-blue-800">{selectedIds.size} student(s) selected</span>
          <button
            type="button"
            onClick={handlePrintSelected}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Print ID Cards
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              {canPrintIdCards && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all students on this page"
                    checked={items.length > 0 && selectedIds.size === items.length}
                    onChange={toggleAll}
                  />
                </th>
              )}
              <th className="px-4 py-3">Admission #</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Class / Section</th>
              <th className="px-4 py-3">Guardian</th>
              <th className="px-4 py-3">Admission Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((student) => (
              <tr key={student.id} className="border-b border-zinc-100 last:border-0">
                {canPrintIdCards && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${student.firstName} ${student.lastName}`}
                      checked={selectedIds.has(student.id)}
                      onChange={() => toggle(student.id)}
                    />
                  </td>
                )}
                <td className="px-4 py-3 font-medium text-zinc-900">{student.admissionNumber}</td>
                <td className="px-4 py-3 text-zinc-900">
                  {student.firstName} {student.lastName}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {student.currentClassName
                    ? `${student.currentClassName}${student.currentSectionName ? ` - ${student.currentSectionName}` : ""}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {student.primaryGuardianName ?? "—"}
                  {student.primaryGuardianPhone ? ` (${student.primaryGuardianPhone})` : ""}
                </td>
                <td className="px-4 py-3 text-zinc-600">{student.admissionDate.toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <StudentStatusBadge status={student.status} deletedAt={student.deletedAt} />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={canPrintIdCards ? 7 : 6} className="px-4 py-8 text-center text-zinc-500">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
