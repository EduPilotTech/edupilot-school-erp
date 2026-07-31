import "server-only";
import { ValidationError } from "@/lib/errors";
import { EMPLOYEE_DOCUMENTS_BUCKET } from "@/lib/storage/buckets";
import { SupabaseStorageService } from "@/lib/storage/supabase-storage.service";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { PrismaEmployeeDocumentRepository } from "../infrastructure/prisma-employee-document.repository";
import { EmployeeNotFoundError } from "../domain/errors";
import { listEmployeeDocumentsSchema, type EmployeeDocumentListItemDTO } from "./dto/employee-document.dto";
import { toEmployeeDocumentDTO } from "./employee-document-storage.helpers";

export interface ListEmployeeDocumentsContext {
  tenantId: string;
}

// Mirrors modules/students/application/list-student-documents.service.ts: lists an employee's
// active documents, each with a freshly-generated signed URL, generated in parallel.
export async function listEmployeeDocuments(input: unknown, context: ListEmployeeDocumentsContext): Promise<EmployeeDocumentListItemDTO[]> {
  const parsed = listEmployeeDocumentsSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid employee id.");
  }
  const { employeeId } = parsed.data;
  const { tenantId } = context;

  const employeeRepository = new PrismaEmployeeRepository();
  const documentRepository = new PrismaEmployeeDocumentRepository();

  const employee = await employeeRepository.findById(tenantId, employeeId);
  if (!employee || employee.deletedAt !== null) {
    throw new EmployeeNotFoundError();
  }

  const documents = await documentRepository.findByEmployee(tenantId, employeeId);
  const sorted = [...documents].sort((a, b) => a.documentType.localeCompare(b.documentType));

  const storage = new SupabaseStorageService();
  return Promise.all(
    sorted.map(async (document) => ({
      ...toEmployeeDocumentDTO(document),
      signedUrl: await storage.signedUrl(EMPLOYEE_DOCUMENTS_BUCKET, document.storageKey),
    }))
  );
}
