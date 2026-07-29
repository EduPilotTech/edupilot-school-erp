import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, StudentDocument as PrismaStudentDocument } from "@/lib/generated/prisma/client";
import type {
  CreateStudentDocumentInput,
  StudentDocumentRepository,
} from "../domain/student-document.repository";
import type { DocumentTypeValue, StudentDocumentEntity } from "../domain/student-document.entity";

function toEntity(row: PrismaStudentDocument): StudentDocumentEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    documentType: row.documentType as DocumentTypeValue,
    originalFileName: row.originalFileName,
    storageKey: row.storageKey,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    uploadedBy: row.uploadedBy,
  };
}

// Every tenant-scoped lookup/write uses `tenantId` explicitly in the `where` clause — no
// (tenantId, id) compound unique here (see domain/student-document.repository.ts's comment), so
// `findFirst`/`updateMany` are used instead of `findUnique`/`update`, the same approach
// PrismaStudentGuardianRepository takes for the same reason.
export class PrismaStudentDocumentRepository implements StudentDocumentRepository {
  async create(
    input: CreateStudentDocumentInput,
    tx?: Prisma.TransactionClient
  ): Promise<StudentDocumentEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (t) =>
        t.studentDocument.create({
          data: {
            tenantId: input.tenantId,
            studentId: input.studentId,
            documentType: input.documentType,
            originalFileName: input.originalFileName,
            storageKey: input.storageKey,
            mimeType: input.mimeType,
            fileSize: input.fileSize,
            uploadedBy: input.uploadedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async findByStudent(tenantId: string, studentId: string): Promise<StudentDocumentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.studentDocument.findMany({
        where: { tenantId, studentId, deletedAt: null },
        orderBy: { createdAt: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async findById(tenantId: string, id: string): Promise<StudentDocumentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.studentDocument.findFirst({ where: { id, tenantId } })
    );
    return row ? toEntity(row) : null;
  }

  async softDelete(
    tenantId: string,
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<StudentDocumentEntity> {
    return withTenantContext(
      tenantId,
      async (t) => {
        const { count } = await t.studentDocument.updateMany({
          where: { id, tenantId },
          data: { deletedAt: new Date() },
        });

        if (count === 0) {
          throw new Error(`StudentDocument ${id} not found for tenant ${tenantId}.`);
        }

        const row = await t.studentDocument.findFirstOrThrow({ where: { id, tenantId } });
        return toEntity(row);
      },
      tx
    );
  }

  async findPhoto(tenantId: string, studentId: string): Promise<StudentDocumentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.studentDocument.findFirst({
        where: { tenantId, studentId, documentType: "PHOTO", deletedAt: null },
        orderBy: { createdAt: "desc" },
      })
    );
    return row ? toEntity(row) : null;
  }
}
