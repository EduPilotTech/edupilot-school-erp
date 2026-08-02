import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext, getCurrentSchool } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { getStudentProfile } from "@/modules/students/application/get-student-profile.service";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { getSchoolBranding } from "@/modules/branding/application/get-school-branding.service";
import { TransferCertificateForm } from "@/components/features/students/TransferCertificateForm";

interface TransferCertificatePageProps {
  params: Promise<{ studentId: string }>;
}

export default async function TransferCertificatePage({ params }: TransferCertificatePageProps) {
  const { studentId } = await params;
  const authContext = await requireAuthContext();
  await requirePermission("student.certificate.print");
  const authorization = await getAuthorizationContext();

  let profile;
  try {
    profile = await getStudentProfile({ studentId }, { tenantId: authContext.tenantId });
  } catch (error) {
    if (error instanceof StudentNotFoundError) notFound();
    throw error;
  }

  const school = await getCurrentSchool();
  const branding = await getSchoolBranding({ tenantId: authContext.tenantId, school });

  const father = profile.guardians.find((g) => g.relationship === "FATHER");
  const mother = profile.guardians.find((g) => g.relationship === "MOTHER");

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 print:py-0">
      <div className="print:hidden">
        <Link href={`/students/${studentId}`} className="text-sm text-blue-600 hover:underline">
          ← Back to Profile
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Transfer Certificate</h1>
        <p className="mt-1 text-sm text-zinc-500">{profile.student.fullName}</p>
      </div>

      <div className="mt-6">
        <TransferCertificateForm
          branding={{
            schoolName: branding.schoolName,
            address: `${branding.address}, ${branding.city}, ${branding.state} ${branding.postalCode}`,
            phone: branding.phone,
            email: branding.email,
            logoUrl: branding.logoUrl,
            themeColor: branding.themeColor,
            headerText: branding.headerText,
            footerText: branding.footerText,
            signatureUrl: branding.signatureUrl,
            sealUrl: branding.sealUrl,
          }}
          studentName={profile.student.fullName}
          admissionNumber={profile.student.admissionNumber}
          fatherName={father?.fullName ?? ""}
          motherName={mother?.fullName ?? ""}
          dateOfBirth={profile.student.dateOfBirth.toLocaleDateString()}
          className={profile.academic ? `${profile.academic.className} - ${profile.academic.sectionName}` : ""}
          academicSessionName={profile.academic?.academicSessionName ?? ""}
          admissionDate={profile.academic ? profile.academic.admissionDate.toLocaleDateString() : ""}
          canPrint={can(authorization, "student.certificate.print")}
        />
      </div>
    </main>
  );
}
