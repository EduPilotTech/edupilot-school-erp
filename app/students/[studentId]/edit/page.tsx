import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { getStudentProfile } from "@/modules/students/application/get-student-profile.service";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { ValidationError } from "@/lib/errors";
import { EditStudentForm } from "./_components/edit-student-form";

interface EditStudentPageProps {
  params: Promise<{ studentId: string }>;
}

// Server Component. Pre-fills the edit form using the existing get-student-profile.service.ts
// (Requirement 1 — reusing the Student Profile service, not a separate fetch), matching
// app/students/new/page.tsx's pattern of gating on requireAuthContext() only at the page level
// while the real `student.update` enforcement lives on updateStudentProfileAction — a
// page-level-only check with nothing behind it would be a false sense of security, and the
// Server Action is reachable directly by POST regardless of what this page renders.
export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const { studentId } = await params;
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();

  if (!can(authorization, "student.update")) {
    notFound();
  }

  let profile;
  try {
    profile = await getStudentProfile({ studentId }, { tenantId: authContext.tenantId });
  } catch (error) {
    if (error instanceof StudentNotFoundError || error instanceof ValidationError) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href={`/students/${profile.student.id}`} className="text-sm text-blue-600 hover:underline">
        ← Back to Profile
      </Link>

      <div className="mb-6 mt-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Student</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Update {profile.student.fullName}&apos;s information, address, and guardian details.
        </p>
      </div>

      <EditStudentForm profile={profile} />
    </main>
  );
}
