import { requireAuthContext, getCurrentSchool } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getFeePayment } from "@/modules/fees/application/get-payment.service";
import { getSchoolBranding } from "@/modules/branding/application/get-school-branding.service";
import { getFeeInvoice } from "@/modules/fees/application/get-invoice.service";
import { listFeeCategories } from "@/modules/fees/application/list-fee-categories.service";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaClassRepository } from "@/modules/academics/infrastructure/prisma-class.repository";
import { ReceiptPrintView } from "@/components/features/fees/ReceiptPrintView";
import "./receipt-print.css";

interface ReceiptPageProps {
  params: Promise<{ paymentId: string }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("fee.receipt.print");

  const { paymentId } = await params;
  const payment = await getFeePayment(authContext.tenantId, paymentId);
  const school = await getCurrentSchool();
  const branding = await getSchoolBranding({ tenantId: authContext.tenantId, school });

  const studentRepository = new PrismaStudentRepository();
  const student = await studentRepository.findById(authContext.tenantId, payment.studentId);

  const categories = await listFeeCategories({ tenantId: authContext.tenantId });
  const invoices = await Promise.all(
    payment.allocations.map((allocation) => getFeeInvoice(authContext.tenantId, allocation.invoiceId))
  );

  const classRepository = new PrismaClassRepository();
  const classEntity = invoices[0] ? await classRepository.findById(authContext.tenantId, invoices[0].classId) : null;

  const lineItems = payment.allocations.map((allocation) => {
    const invoice = invoices.find((candidate) => candidate.id === allocation.invoiceId);
    const category = categories.find((candidate) => candidate.id === invoice?.feeCategoryId);
    return {
      invoiceNumber: invoice?.invoiceNumber ?? allocation.invoiceId,
      description: `${category?.name ?? "Fee"} (${invoice?.billingPeriod ?? ""})`,
      amount: allocation.amountAllocated,
    };
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <ReceiptPrintView
        schoolName={school.schoolName}
        schoolAddress={`${school.address}, ${school.city}, ${school.state} ${school.postalCode}`}
        logoUrl={branding.logoUrl}
        footerText={branding.footerText}
        payment={payment}
        studentName={student ? `${student.firstName} ${student.lastName}` : "Unknown"}
        admissionNumber={student?.admissionNumber ?? ""}
        className={classEntity?.name ?? ""}
        lineItems={lineItems}
      />
    </main>
  );
}
