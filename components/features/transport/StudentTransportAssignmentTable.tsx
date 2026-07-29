"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignStudentTransportAction, updateStudentTransportStatusAction } from "@/app/transport/actions";
import type { RouteDTO, RouteStopDTO } from "@/modules/transport/application/dto/route.dto";
import type { StudentTransportAssignmentDTO } from "@/modules/transport/application/dto/student-transport-assignment.dto";

interface StudentRow {
  id: string;
  admissionNumber: string;
  fullName: string;
  currentAssignment: StudentTransportAssignmentDTO | null;
}

interface StudentTransportAssignmentTableProps {
  academicSessionId: string;
  students: StudentRow[];
  routes: RouteDTO[];
  stopsByRoute: Record<string, RouteStopDTO[]>;
  canManage: boolean;
}

const TRIP_TYPES = ["PICKUP_AND_DROP", "PICKUP_ONLY", "DROP_ONLY"];
const STATUSES = ["ACTIVE", "TEMPORARY_STOP", "DISCONTINUED"];

// Binds a student to a Route + Stop for the session — the transport analogue of
// StudentFeeAssignmentTable, upsert on the natural key.
export function StudentTransportAssignmentTable({
  academicSessionId,
  students,
  routes,
  stopsByRoute,
  canManage,
}: StudentTransportAssignmentTableProps) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, { routeId: string; stopId: string; tripType: string }>>(() =>
    Object.fromEntries(
      students.map((student) => {
        const routeId = student.currentAssignment?.routeId ?? routes[0]?.id ?? "";
        return [
          student.id,
          {
            routeId,
            stopId: student.currentAssignment?.stopId ?? stopsByRoute[routeId]?.[0]?.id ?? "",
            tripType: student.currentAssignment?.tripType ?? "PICKUP_AND_DROP",
          },
        ];
      })
    )
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign(studentId: string) {
    setSavingId(studentId);
    setError(null);
    try {
      const draft = drafts[studentId];
      const result = await assignStudentTransportAction({
        studentId,
        academicSessionId,
        routeId: draft.routeId,
        stopId: draft.stopId,
        tripType: draft.tripType,
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

  async function handleStatusChange(studentId: string, status: string) {
    setSavingId(studentId);
    setError(null);
    try {
      const result = await updateStudentTransportStatusAction(studentId, academicSessionId, { status });
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
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Admission #</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Route</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Stop</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Trip</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {students.map((student) => {
              const draft = drafts[student.id];
              const stops = stopsByRoute[draft.routeId] ?? [];
              return (
                <tr key={student.id}>
                  <td className="px-4 py-2 text-zinc-700">{student.admissionNumber}</td>
                  <td className="px-4 py-2 text-zinc-900">{student.fullName}</td>
                  <td className="px-4 py-2">
                    <select
                      value={draft.routeId}
                      disabled={!canManage}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [student.id]: {
                            ...prev[student.id],
                            routeId: e.target.value,
                            stopId: stopsByRoute[e.target.value]?.[0]?.id ?? "",
                          },
                        }))
                      }
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                    >
                      {routes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={draft.stopId}
                      disabled={!canManage}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [student.id]: { ...prev[student.id], stopId: e.target.value },
                        }))
                      }
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                    >
                      {stops.map((stop) => (
                        <option key={stop.id} value={stop.id}>
                          {stop.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={draft.tripType}
                      disabled={!canManage}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [student.id]: { ...prev[student.id], tripType: e.target.value },
                        }))
                      }
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                    >
                      {TRIP_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    {student.currentAssignment ? (
                      <select
                        value={student.currentAssignment.status}
                        disabled={!canManage || savingId === student.id}
                        onChange={(e) => handleStatusChange(student.id, e.target.value)}
                        className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-zinc-400">Not assigned</span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleAssign(student.id)}
                        disabled={savingId === student.id || !draft.routeId || !draft.stopId}
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
