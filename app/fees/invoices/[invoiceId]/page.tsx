import { requireAuthContext, getCurrentSchool } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { getFeeInvoice } from "@/modules/fees/application/get-invoice.service";
import { listFeeCategories } from "@/modules/fees/application/list-fee-categories.service";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaClassRepository } from "@/modules/academics/infrastructure/prisma-class.repository";
import { getSchoolBranding } from "@/modules/branding/application/get-school-branding.service";
import { InvoicePrintView } from "@/components/features/fees/InvoicePrintView";

interface InvoicePageProps {
  params: Promise<{ invoiceId: string }>;
}

// Completion Pass — Invoice branding (checklist #8). Mirrors app/fees/collect/[paymentId]/
// receipt/page.tsx's own data-fetching shape (same repositories, same tenant-scoped reads) —
// the one difference is this reads a FeeInvoice directly rather than a FeePayment's allocations.
export default async function InvoicePage({ params }: InvoicePageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("fee.invoice.view");
  const authorization = await getAuthorizationContext();

  const { invoiceId } = await params;
  const invoice = await getFeeInvoice(authContext.tenantId, invoiceId);

  const studentRepository = new PrismaStudentRepository();
  const student = await studentRepository.findById(authContext.tenantId, invoice.studentId);

  const classRepository = new PrismaClassRepository();
  const classEntity = await classRepository.findById(authContext.tenantId, invoice.classId);

  const categories = await listFeeCategories({ tenantId: authContext.tenantId });
  const category = categories.find((candidate) => candidate.id === invoice.feeCategoryId);

  const school = await getCurrentSchool();
  const branding = await getSchoolBranding({ tenantId: authContext.tenantId, school });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <InvoicePrintView
        invoice={invoice}
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
        studentName={student ? `${student.firstName} ${student.lastName}` : "Unknown"}
        admissionNumber={student?.admissionNumber ?? ""}
        className={classEntity?.name ?? ""}
        lineItems={[{ description: `${category?.name ?? "Fee"} (${invoice.billingPeriod})`, amount: invoice.amount }]}
        canPrint={can(authorization, "fee.receipt.print")}
      />
    </main>
  );
}
