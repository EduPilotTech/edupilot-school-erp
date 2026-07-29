"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTeacherAction, updateTeacherAction } from "@/app/teachers/actions";
import type { TeacherDTO } from "@/modules/teachers/application/dto/teacher.dto";

interface CandidateUser {
  id: string;
  fullName: string;
  email: string | null;
}

interface TeacherManagerProps {
  items: TeacherDTO[];
  candidates: CandidateUser[];
  canManage: boolean;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Promotes an existing UserProfile (already holding the Teacher or Class Teacher role) into a
// Teacher record — never creates a new UserProfile, per Phase 6 Decision 1. `candidates` is the
// set of eligible users not yet promoted, resolved server-side by the page.
export function TeacherManager({ items, candidates, canManage }: TeacherManagerProps) {
  const router = useRouter();
  const [userProfileId, setUserProfileId] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [joiningDate, setJoiningDate] = useState(todayIsoDate());
  const [qualification, setQualification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createTeacherAction({
        userProfileId,
        employeeCode,
        joiningDate,
        qualification: qualification || undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setUserProfileId("");
      setEmployeeCode("");
      setQualification("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(teacher: TeacherDTO) {
    setTogglingId(teacher.id);
    setError(null);
    try {
      const result = await updateTeacherAction(teacher.id, { isActive: !teacher.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="teacher-user" className="text-xs font-medium text-zinc-500">
              Staff Member
            </label>
            <select
              id="teacher-user"
              value={userProfileId}
              onChange={(e) => setUserProfileId(e.target.value)}
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              <option value="">Select user</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.fullName} {candidate.email ? `(${candidate.email})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="teacher-code" className="text-xs font-medium text-zinc-500">
              Employee Code
            </label>
            <input
              id="teacher-code"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="EMP-001"
              className="w-32 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="teacher-joining" className="text-xs font-medium text-zinc-500">
              Joining Date
            </label>
            <input
              id="teacher-joining"
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="teacher-qualification" className="text-xs font-medium text-zinc-500">
              Qualification
            </label>
            <input
              id="teacher-qualification"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="B.Ed"
              className="w-40 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !userProfileId || !employeeCode}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Teacher"}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Employee Code</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Qualification</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((teacher) => (
              <tr key={teacher.id}>
                <td className="px-4 py-2 text-zinc-900">{teacher.fullName}</td>
                <td className="px-4 py-2 text-zinc-700">{teacher.employeeCode}</td>
                <td className="px-4 py-2 text-zinc-700">{teacher.qualification ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{teacher.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(teacher)}
                      disabled={togglingId === teacher.id}
                      className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {teacher.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No teachers yet.</p>}
      </div>
    </div>
  );
}
