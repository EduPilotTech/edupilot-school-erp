import { requireAuthContext } from "@/lib/auth/auth-context";
import { AdmissionForm } from "@/components/features/students/AdmissionForm";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listClasses } from "@/modules/academics/application/list-classes.service";
import { listSections } from "@/modules/academics/application/list-sections.service";
import type { AcademicOptions } from "@/components/features/students/admission-form.types";

// Server Component wrapper. Gates on requireAuthContext() only (an authenticated, ACTIVE tenant
// member) — real `student.admit` permission enforcement lives on admitStudentAction
// (app/students/new/actions.ts), matching the pattern already established in
// app/settings/users/actions.ts: a page-level-only check with nothing behind it to actually
// enforce would be a false sense of security, and the Server Action is reachable directly by
// POST regardless of what this page renders.
export default async function NewStudentAdmissionPage() {
  const authContext = await requireAuthContext();

  const [sessions, classes, sections] = await Promise.all([
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
    listClasses({ tenantId: authContext.tenantId }),
    listSections({ tenantId: authContext.tenantId }),
  ]);

  const academicOptions: AcademicOptions = {
    academicSessions: sessions.map((session) => ({ value: session.id, label: session.sessionName })),
    classes: classes.map((classEntity) => ({ value: classEntity.id, label: classEntity.name })),
    sections: sections.map((section) => ({ value: section.id, label: section.name })),
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">New Student Admission</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter the student&apos;s details below. Fields marked with * are required to submit.
        </p>
      </div>

      <AdmissionForm academicOptions={academicOptions} />
    </main>
  );
}
