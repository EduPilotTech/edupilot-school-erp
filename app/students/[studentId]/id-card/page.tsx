import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext, getCurrentSchool } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { getStudentIdCard } from "@/modules/students/application/get-student-id-card.service";
import { getSchoolBranding } from "@/modules/branding/application/get-school-branding.service";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { ValidationError } from "@/lib/errors";
import { StudentIdCardPreview } from "./_components/student-id-card-preview";
import "./id-card-print.css";

interface StudentIdCardPageProps {
  params: Promise<{ studentId: string }>;
}

// Server Component — matches every other student-scoped read page in this codebase: the
// application service is called directly, no Server Action (a pure read). Gated on
// `student.idcard.view` (Admin/Office/Teacher can all view); Print/Export controls are
// separately gated on `student.idcard.print` inside StudentIdCardPreview (Teacher is
// deliberately excluded from that one — the 3-tier "Teacher view-only" requirement).
export default async function StudentIdCardPage({ params }: StudentIdCardPageProps) {
  const { studentId } = await params;
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();

  if (!can(authorization, "student.idcard.view")) {
    notFound();
  }

  const school = await getCurrentSchool();
  const branding = await getSchoolBranding({ tenantId: authContext.tenantId, school });

  let card;
  try {
    card = await getStudentIdCard(
      { studentId },
      {
        tenantId: authContext.tenantId,
        school: {
          name: school.schoolName,
          logoUrl: branding.logoUrl,
          address: `${school.address}, ${school.city}, ${school.state} ${school.postalCode}`,
          phone: school.phone,
          email: school.email,
          themeColor: branding.themeColor,
          signatureUrl: branding.signatureUrl,
          sealUrl: branding.sealUrl,
        },
      }
    );
  } catch (error) {
    if (error instanceof StudentNotFoundError || error instanceof ValidationError) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="id-card-screen-only mb-6">
        <Link href={`/students/${studentId}`} className="text-sm text-blue-600 hover:underline">
          ← Back to Profile
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Student ID Card</h1>
        <p className="mt-1 text-sm text-zinc-500">{card.student.fullName}</p>
      </div>

      <StudentIdCardPreview card={card} canPrint={can(authorization, "student.idcard.print")} />
    </main>
  );
}
