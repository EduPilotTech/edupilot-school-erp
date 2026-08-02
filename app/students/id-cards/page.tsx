import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext, getCurrentSchool } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { getStudentIdCard } from "@/modules/students/application/get-student-id-card.service";
import { getSchoolBranding } from "@/modules/branding/application/get-school-branding.service";
import { IdCardFront } from "../[studentId]/id-card/_components/id-card-front";
import { IdCardBack } from "../[studentId]/id-card/_components/id-card-back";
import { BatchPrintControls } from "./_components/batch-print-controls";
import { chunk } from "./chunk";
import type { StudentIdCardDTO } from "@/modules/students/application/dto/student-id-card.dto";
import "./id-card-batch-print.css";

interface StudentIdCardsBatchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// 2 columns x 4 rows fit one A4 page at CR80 size with a 10mm margin and 5mm gaps (see
// id-card-batch-print.css's grid-template-columns) — the same constant governs both the CSS
// layout and how this page chunks students into pages.
const CARDS_PER_PAGE = 8;

// Server Component — batch entry point reached from the Student List page's checkbox selection
// (app/students/_components/students-table-with-selection.tsx). Gated on `student.idcard.print`
// specifically (not just `.view`) — batch printing produces takeaway output, the same tier as
// single-card Print/Export, so Teachers (view-only) cannot reach this page even by URL.
// Fronts are printed as full pages, then backs as full pages in the SAME grid positions, so
// printing fronts, flipping the stack, and printing backs aligns each card's two sides.
export default async function StudentIdCardsBatchPage({ searchParams }: StudentIdCardsBatchPageProps) {
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();

  if (!can(authorization, "student.idcard.print")) {
    notFound();
  }

  const params = await searchParams;
  const idsParam = Array.isArray(params.ids) ? params.ids[0] : params.ids;
  const studentIds = (idsParam ?? "").split(",").map((id) => id.trim()).filter(Boolean);

  if (studentIds.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm text-zinc-500">
          No students selected. Go back to the{" "}
          <Link href="/students" className="text-blue-600 hover:underline">
            Students list
          </Link>{" "}
          and select at least one student to print ID cards.
        </p>
      </main>
    );
  }

  const school = await getCurrentSchool();
  const branding = await getSchoolBranding({ tenantId: authContext.tenantId, school });
  const schoolInfo = {
    name: school.schoolName,
    logoUrl: branding.logoUrl,
    address: `${school.address}, ${school.city}, ${school.state} ${school.postalCode}`,
    phone: school.phone,
    email: school.email,
    themeColor: branding.themeColor,
    signatureUrl: branding.signatureUrl,
    sealUrl: branding.sealUrl,
  };

  // Missing/soft-deleted students (e.g. a stale selection) are silently skipped rather than
  // failing the whole batch — a `notFound()` for one id would block printing the rest, which is
  // worse than quietly omitting a card that can't be produced.
  const cardResults = await Promise.allSettled(
    studentIds.map((studentId) =>
      getStudentIdCard({ studentId }, { tenantId: authContext.tenantId, school: schoolInfo })
    )
  );
  const cards: StudentIdCardDTO[] = cardResults
    .filter((result): result is PromiseFulfilledResult<StudentIdCardDTO> => result.status === "fulfilled")
    .map((result) => result.value);

  const pages = chunk(cards, CARDS_PER_PAGE);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="id-card-screen-only mb-6 flex items-center justify-between">
        <div>
          <Link href="/students" className="text-sm text-blue-600 hover:underline">
            ← Back to Students
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Batch Print ID Cards</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {cards.length} of {studentIds.length} selected student(s) ready to print.
          </p>
        </div>
        <BatchPrintControls />
      </div>

      <div className="id-card-screen-only flex flex-col gap-4">
        {pages.map((pageCards, pageIndex) => (
          <div key={pageIndex} className="flex flex-wrap gap-4 rounded-xl border border-zinc-200 p-4">
            {pageCards.map((card) => (
              <div key={card.student.id} className="origin-top-left scale-75">
                <IdCardFront card={card} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div id="id-card-batch-print-area" className="hidden print:block">
        {pages.map((pageCards, pageIndex) => (
          <div key={`front-${pageIndex}`} className="id-card-batch-page">
            {pageCards.map((card) => (
              <IdCardFront key={card.student.id} card={card} />
            ))}
          </div>
        ))}
        {pages.map((pageCards, pageIndex) => (
          <div key={`back-${pageIndex}`} className="id-card-batch-page">
            {pageCards.map((card) => (
              <IdCardBack key={card.student.id} card={card} />
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
