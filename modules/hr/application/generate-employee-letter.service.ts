import "server-only";
import { jsPDF } from "jspdf";
import { ValidationError } from "@/lib/errors";
import { EMPLOYEE_DOCUMENTS_BUCKET } from "@/lib/storage/buckets";
import { SupabaseStorageService } from "@/lib/storage/supabase-storage.service";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { PrismaEmployeeDocumentRepository } from "../infrastructure/prisma-employee-document.repository";
import { PrismaDepartmentRepository } from "../infrastructure/prisma-department.repository";
import { PrismaDesignationRepository } from "../infrastructure/prisma-designation.repository";
import { EmployeeNotFoundError } from "../domain/errors";
import { generateEmployeeLetterSchema, type EmployeeDocumentDTO } from "./dto/employee-document.dto";
import { buildEmployeeDocumentStorageKey, toEmployeeDocumentDTO } from "./employee-document-storage.helpers";
import { buildEmployeeLetterContent } from "./employee-letter-templates.helpers";
import type { HrContext } from "./hr-context";

export interface EmployeeLetterSchoolInfo {
  name: string;
  address: string;
}

export interface GenerateEmployeeLetterContext extends HrContext {
  // Mirrors GetStudentIdCardContext's own precedent (modules/students/application/
  // get-student-id-card.service.ts): school branding data is passed in by the caller (a Server
  // Component/Action already holding `getCurrentSchool()`), not re-fetched by this service.
  school: EmployeeLetterSchoolInfo;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}

// Builds a simple, clean, single-page A4 business letter PDF server-side with jsPDF's text APIs
// (no html2canvas — that is browser-only), uploads it to the employee-documents bucket, and
// records an EmployeeDocument row with `issuedDate: new Date()` and `generatedBy: actingUserId`.
export async function generateEmployeeLetter(input: unknown, context: GenerateEmployeeLetterContext): Promise<EmployeeDocumentDTO> {
  const parsed = generateEmployeeLetterSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid letter request.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId, school } = context;

  const employeeRepository = new PrismaEmployeeRepository();
  const employee = await employeeRepository.findById(tenantId, data.employeeId);
  if (!employee || employee.deletedAt !== null) {
    throw new EmployeeNotFoundError();
  }

  const [userDetail, department, designation] = await Promise.all([
    getUserDetail(employee.userProfileId, { tenantId }),
    new PrismaDepartmentRepository().findById(tenantId, employee.departmentId),
    new PrismaDesignationRepository().findById(tenantId, employee.designationId),
  ]);
  if (!userDetail) {
    throw new EmployeeNotFoundError();
  }

  const effectiveDate = data.effectiveDate ?? new Date();
  const content = buildEmployeeLetterContent(data.documentType, {
    employeeName: userDetail.profile.fullName,
    employeeCode: employee.employeeCode,
    designationName: designation?.name ?? "",
    departmentName: department?.name ?? "",
    joiningDateText: formatDate(employee.joiningDate),
    effectiveDateText: formatDate(effectiveDate),
    relievingDateText: data.relievingDate ? formatDate(data.relievingDate) : null,
    newDesignationName: data.newDesignationName ?? null,
    remarks: data.remarks ?? null,
  });

  const pdfBuffer = renderLetterPdf(school, content, formatDate(new Date()));

  const storageKey = buildEmployeeDocumentStorageKey(tenantId, data.employeeId, data.documentType, `${content.title.replace(/\s+/g, "_")}.pdf`);
  const storage = new SupabaseStorageService();

  await storage.upload({
    bucket: EMPLOYEE_DOCUMENTS_BUCKET,
    key: storageKey,
    file: pdfBuffer,
    contentType: "application/pdf",
  });

  const documentRepository = new PrismaEmployeeDocumentRepository();
  try {
    const document = await documentRepository.create({
      tenantId,
      employeeId: data.employeeId,
      documentType: data.documentType,
      originalFileName: `${content.title.replace(/\s+/g, "_")}.pdf`,
      storageKey,
      mimeType: "application/pdf",
      fileSize: pdfBuffer.byteLength,
      issuedDate: new Date(),
      createdBy: actingUserId,
    });
    return toEmployeeDocumentDTO(document);
  } catch (error) {
    await storage.delete(EMPLOYEE_DOCUMENTS_BUCKET, storageKey).catch(() => {});
    throw error;
  }
}

function renderLetterPdf(
  school: EmployeeLetterSchoolInfo,
  content: { title: string; paragraphs: string[] },
  issuedDateText: string
): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(school.name, marginX, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(school.address, marginX, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Date: ${issuedDateText}`, marginX, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(content.title, pageWidth / 2, y, { align: "center" });
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  for (const paragraph of content.paragraphs) {
    const lines = doc.splitTextToSize(paragraph, contentWidth) as string[];
    doc.text(lines, marginX, y);
    y += lines.length * 6 + 6;
  }

  y += 16;
  doc.text("For, " + school.name, marginX, y);
  y += 20;
  doc.text("Authorized Signatory", marginX, y);

  const arrayBuffer = doc.output("arraybuffer") as ArrayBuffer;
  return Buffer.from(arrayBuffer);
}
