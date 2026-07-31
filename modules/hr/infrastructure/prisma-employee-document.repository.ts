import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { EmployeeDocument as PrismaEmployeeDocument, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateEmployeeDocumentInput,
  EmployeeDocumentRepository,
} from "../domain/employee-document.repository";
import type { EmployeeDocumentEntity, EmployeeDocumentTypeValue } from "../domain/employee-document.entity";

function toEntity(row: PrismaEmployeeDocument): EmployeeDocumentEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    employeeId: row.employeeId,
    documentType: row.documentType as EmployeeDocumentTypeValue,
    originalFileName: row.originalFileName,
    storageKey: row.storageKey,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
    issuedDate: row.issuedDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
  };
}

export class PrismaEmployeeDocumentRepository implements EmployeeDocumentRepository {
  async create(input: CreateEmployeeDocumentInput, tx?: Prisma.TransactionClient): Promise<EmployeeDocumentEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.employeeDocument.create({
          data: {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            documentType: input.documentType,
            originalFileName: input.originalFileName,
            storageKey: input.storageKey,
            mimeType: input.mimeType,
            fileSize: input.fileSize,
            issuedDate: input.issuedDate ?? null,
            createdBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async findByEmployee(tenantId: string, employeeId: string): Promise<EmployeeDocumentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.employeeDocument.findMany({
        where: { tenantId, employeeId, deletedAt: null },
        orderBy: { createdAt: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async findById(tenantId: string, id: string): Promise<EmployeeDocumentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.employeeDocument.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async softDelete(tenantId: string, id: string, tx?: Prisma.TransactionClient): Promise<EmployeeDocumentEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.employeeDocument.update({
          where: { tenantId_id: { tenantId, id } },
          data: { deletedAt: new Date() },
        }),
      tx
    );
    return toEntity(row);
  }
}
