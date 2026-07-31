import type { Prisma } from "@/lib/generated/prisma/client";
import type { EmployeeDocumentEntity, EmployeeDocumentTypeValue } from "./employee-document.entity";

export interface CreateEmployeeDocumentInput {
  tenantId: string;
  employeeId: string;
  documentType: EmployeeDocumentTypeValue;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  issuedDate?: Date | null;
  createdBy?: string | null;
}

// Mirrors StudentDocumentRepository — a document is immutable once created (no `update` method);
// "Replace" is a soft-delete of the old row followed by a `create` of a new one.
export interface EmployeeDocumentRepository {
  create(input: CreateEmployeeDocumentInput, tx?: Prisma.TransactionClient): Promise<EmployeeDocumentEntity>;
  findByEmployee(tenantId: string, employeeId: string): Promise<EmployeeDocumentEntity[]>;
  findById(tenantId: string, id: string): Promise<EmployeeDocumentEntity | null>;
  softDelete(tenantId: string, id: string, tx?: Prisma.TransactionClient): Promise<EmployeeDocumentEntity>;
}
