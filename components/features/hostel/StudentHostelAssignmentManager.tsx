"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  checkInStudentHostelAction,
  transferStudentHostelAction,
  checkOutStudentHostelAction,
} from "@/app/hostel/actions";
import type { HostelRoomDTO, HostelBedDTO } from "@/modules/hostel/application/dto/hostel-structure.dto";
import type { StudentHostelAssignmentDTO } from "@/modules/hostel/application/dto/student-hostel-assignment.dto";

interface StudentRow {
  id: string;
  admissionNumber: string;
  fullName: string;
  currentAssignment: StudentHostelAssignmentDTO | null;
}

interface StudentHostelAssignmentManagerProps {
  academicSessionId: string;
  students: StudentRow[];
  rooms: HostelRoomDTO[];
  vacantBedsByRoom: Record<string, HostelBedDTO[]>;
  canManage: boolean;
}

const DIET_TYPES = ["", "VEG", "NON_VEG", "JAIN", "VEGAN", "OTHER"];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Check-in / Transfer / Check-out for one student at a time — the room/bed cascading select
// mirrors StudentTransportAssignmentTable's own route/stop pattern exactly, keyed by vacant beds
// only (an occupied or blocked bed is never offered here).
export function StudentHostelAssignmentManager({
  academicSessionId,
  students,
  rooms,
  vacantBedsByRoom,
  canManage,
}: StudentHostelAssignmentManagerProps) {
  const router = useRouter();
  const [selectedRoomId, setSelectedRoomId] = useState<Record<string, string>>({});
  const [selectedBedId, setSelectedBedId] = useState<Record<string, string>>({});
  const [dietPreference, setDietPreference] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function roomFor(studentId: string): string {
    return selectedRoomId[studentId] ?? rooms[0]?.id ?? "";
  }
  function bedFor(studentId: string): string {
    return selectedBedId[studentId] ?? vacantBedsByRoom[roomFor(studentId)]?.[0]?.id ?? "";
  }

  async function handleCheckIn(studentId: string) {
    setSavingId(studentId);
    setError(null);
    try {
      const result = await checkInStudentHostelAction({
        studentId,
        academicSessionId,
        roomId: roomFor(studentId),
        bedId: bedFor(studentId),
        dietPreference: dietPreference[studentId] || undefined,
        checkInDate: todayIsoDate(),
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

  async function handleTransfer(studentId: string) {
    setSavingId(studentId);
    setError(null);
    try {
      const result = await transferStudentHostelAction({
        studentId,
        academicSessionId,
        newRoomId: roomFor(studentId),
        newBedId: bedFor(studentId),
        transferDate: todayIsoDate(),
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

  async function handleCheckOut(studentId: string) {
    setSavingId(studentId);
    setError(null);
    try {
      const result = await checkOutStudentHostelAction({ studentId, academicSessionId, checkOutDate: todayIsoDate() });
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
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Current Status</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Room</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Bed</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Diet</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {students.map((student) => {
              const room = roomFor(student.id);
              const bed = bedFor(student.id);
              const vacantBeds = vacantBedsByRoom[room] ?? [];
              const hasAssignment = Boolean(student.currentAssignment);

              return (
                <tr key={student.id}>
                  <td className="px-4 py-2 text-zinc-700">{student.admissionNumber}</td>
                  <td className="px-4 py-2 text-zinc-900">
                    {student.fullName}
                    <Link href={`/hostel/assignments/${student.id}/history`} className="ml-2 text-xs text-blue-600 hover:underline">
                      History
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-700">
                    {student.currentAssignment ? student.currentAssignment.status : "Not assigned"}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={room}
                      disabled={!canManage}
                      onChange={(e) =>
                        setSelectedRoomId((prev) => ({ ...prev, [student.id]: e.target.value }))
                      }
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.roomNumber}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={bed}
                      disabled={!canManage || vacantBeds.length === 0}
                      onChange={(e) => setSelectedBedId((prev) => ({ ...prev, [student.id]: e.target.value }))}
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                    >
                      {vacantBeds.length === 0 && <option value="">No vacant beds</option>}
                      {vacantBeds.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bedNumber}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={dietPreference[student.id] ?? ""}
                      disabled={!canManage}
                      onChange={(e) => setDietPreference((prev) => ({ ...prev, [student.id]: e.target.value }))}
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                    >
                      {DIET_TYPES.map((diet) => (
                        <option key={diet} value={diet}>
                          {diet || "—"}
                        </option>
                      ))}
                    </select>
                  </td>
                  {canManage && (
                    <td className="px-4 py-2 text-right">
                      {hasAssignment ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleTransfer(student.id)}
                            disabled={savingId === student.id || !bed}
                            className="mr-3 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Transfer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCheckOut(student.id)}
                            disabled={savingId === student.id}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Check Out
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(student.id)}
                          disabled={savingId === student.id || !bed}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingId === student.id ? "Saving…" : "Check In"}
                        </button>
                      )}
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
