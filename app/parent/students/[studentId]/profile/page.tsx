import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMyStudentProfile } from "@/modules/parents/application/get-my-student-profile.service";

interface PageProps {
  params: Promise<{ studentId: string }>;
}

// Student Profile View (requirement 5) — reuses get-student-profile.service.ts (Phase 4) via the
// guardian-gated getMyStudentProfile wrapper.
export default async function ParentStudentProfilePage({ params }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("parent.student.view");
  const { studentId } = await params;

  const profile = await getMyStudentProfile(
    { studentId },
    { tenantId: authContext.tenantId, userProfileId: authContext.userId }
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">{profile.student.fullName}</h1>
      <p className="mt-1 text-sm text-zinc-500">Admission #{profile.student.admissionNumber}</p>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Academic Information</h2>
        {profile.academic ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Session</dt>
              <dd className="text-zinc-900">{profile.academic.academicSessionName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Class</dt>
              <dd className="text-zinc-900">{profile.academic.className}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Section</dt>
              <dd className="text-zinc-900">{profile.academic.sectionName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Roll Number</dt>
              <dd className="text-zinc-900">{profile.academic.rollNumber ?? "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No current enrollment.</p>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Guardians</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {profile.guardians.map((guardian) => (
            <li key={guardian.id} className="text-zinc-700">
              <span className="font-medium text-zinc-900">{guardian.fullName}</span> ({guardian.relationship}
              {guardian.isPrimary ? ", Primary" : ""}) {guardian.phone ? `· ${guardian.phone}` : ""}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
