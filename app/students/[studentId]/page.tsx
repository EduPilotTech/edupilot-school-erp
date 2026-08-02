import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { getStudentProfile } from "@/modules/students/application/get-student-profile.service";
import { listStudentDocuments } from "@/modules/students/application/list-student-documents.service";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { ValidationError } from "@/lib/errors";
import { OverviewCard } from "./_components/overview-card";
import { AcademicInfoCard } from "./_components/academic-info-card";
import { GuardianInfoCard } from "./_components/guardian-info-card";
import { AddressCard } from "./_components/address-card";
import { MedicalCard } from "./_components/medical-card";
import { EnrollmentHistoryCard } from "./_components/enrollment-history-card";
import { ActivityTimelineCard } from "./_components/activity-timeline-card";
import { ProfileTabs } from "./_components/profile-tabs";
import { DocumentsTabContent } from "./_components/documents/documents-tab-content";

interface StudentProfilePageProps {
  params: Promise<{ studentId: string }>;
}

// Server Component — matches app/students/page.tsx's read pattern exactly: application
// services are called directly, no Server Action (these are pure reads; this codebase reserves
// Server Actions for mutations). `params` is a Promise in this Next.js version and must be
// awaited (see AGENTS.md). A malformed id or a student that doesn't exist/belongs to another
// tenant/is soft-deleted are all surfaced as StudentNotFoundError or ValidationError by
// getStudentProfile and mapped to Next.js's notFound() here — the same "authenticated but not
// found" convention already used by lib/auth/rbac.ts's requirePermission().
//
// Sprint 4.8C: introduces a lightweight tab switcher (ProfileTabs) so a "Documents" tab can host
// the new upload/list/preview UI alongside the existing Overview content, without a full page
// redesign. Role-based visibility (upload/delete buttons) is resolved here, server-side, from
// the same `authorization` context already used for the Edit link — never re-derived client-side.
export default async function StudentProfilePage({ params }: StudentProfilePageProps) {
  const { studentId } = await params;
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();

  let profile;
  try {
    profile = await getStudentProfile({ studentId }, { tenantId: authContext.tenantId });
  } catch (error) {
    if (error instanceof StudentNotFoundError || error instanceof ValidationError) {
      notFound();
    }
    throw error;
  }

  const documents = await listStudentDocuments(
    { studentId: profile.student.id },
    { tenantId: authContext.tenantId }
  );

  const canUploadDocuments = can(authorization, "student.document.upload");
  const canUploadPhoto = can(authorization, "student.photo.upload");
  const canDeleteDocuments = can(authorization, "student.document.delete");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <Link href="/students" className="text-sm text-blue-600 hover:underline">
          ← Back to Students
        </Link>
        <div className="flex items-center gap-3">
          {can(authorization, "student.idcard.view") && (
            <Link
              href={`/students/${profile.student.id}/id-card`}
              className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
            >
              ID Card
            </Link>
          )}
          {can(authorization, "student.certificate.print") && (
            <>
              <Link
                href={`/students/${profile.student.id}/certificate`}
                className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
              >
                Bonafide Certificate
              </Link>
              <Link
                href={`/students/${profile.student.id}/transfer-certificate`}
                className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
              >
                Transfer Certificate
              </Link>
            </>
          )}
          {can(authorization, "student.update") && (
            <Link
              href={`/students/${profile.student.id}/edit`}
              className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      <div className="mt-4">
        <ProfileTabs
          tabs={[
            {
              id: "overview",
              label: "Overview",
              content: (
                <div className="flex flex-col gap-6">
                  <OverviewCard student={profile.student} />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <AcademicInfoCard academic={profile.academic} />
                    <AddressCard address={profile.address} />
                    <div className="md:col-span-2">
                      <GuardianInfoCard guardians={profile.guardians} />
                    </div>
                    <MedicalCard medical={profile.medical} />
                  </div>

                  <EnrollmentHistoryCard enrollments={profile.enrollmentHistory} />
                  <ActivityTimelineCard timeline={profile.activityTimeline} />
                </div>
              ),
            },
            {
              id: "documents",
              label: "Documents",
              content: (
                <DocumentsTabContent
                  studentId={profile.student.id}
                  fullName={profile.student.fullName}
                  documents={documents}
                  canUploadDocuments={canUploadDocuments}
                  canUploadPhoto={canUploadPhoto}
                  canDelete={canDeleteDocuments}
                />
              ),
            },
          ]}
        />
      </div>
    </main>
  );
}
