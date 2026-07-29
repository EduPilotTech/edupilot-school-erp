"use server";

// Thin Server Actions only — no business logic here, matching every other actions.ts in this
// codebase (app/students/new/actions.ts, app/students/[studentId]/edit/actions.ts). No page.tsx
// exists in this route yet — these Server Actions are backend-only this sprint (Sprint 4.8B);
// the UI that calls them is Sprint 4.8C's scope.
//
// Permission mapping: `student.photo.upload` gates PHOTO uploads/replaces; `student.document
// .upload` gates every other document type's uploads/replaces (Replace is treated as an upload
// variant for permission purposes — no separate "replace" permission was authorized this sprint,
// and none was invented). `student.document.delete` gates every delete, including photos — no
// `student.photo.delete` code exists (only the 3 codes Sprint 4.8A seeded), so document deletion
// is not split by type the way upload is.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError } from "@/lib/errors";
import { uploadStudentDocument } from "@/modules/students/application/upload-student-document.service";
import { replaceStudentDocument } from "@/modules/students/application/replace-student-document.service";
import { deleteStudentDocument } from "@/modules/students/application/delete-student-document.service";
import {
  StudentNotFoundError,
  DocumentNotFoundError,
  DocumentTooLargeError,
  UnsupportedFileTypeError,
} from "@/modules/students/domain/errors";
import type {
  DeleteStudentDocumentResult,
  StudentDocumentDTO,
} from "@/modules/students/application/dto/student-document.dto";
import type { DocumentTypeValue } from "@/modules/students/domain/student-document.entity";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function permissionForDocumentType(documentType: DocumentTypeValue): string {
  return documentType === "PHOTO" ? "student.photo.upload" : "student.document.upload";
}

// Shared by all three actions below — never string-matches `error.message`, only `instanceof`
// (docs/CODING_STANDARDS.md §5). Unexpected errors are rethrown, never swallowed.
function translateDocumentError(error: unknown): ActionResult<never> {
  if (error instanceof StudentNotFoundError) {
    return { success: false, error: { code: "STUDENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof DocumentNotFoundError) {
    return { success: false, error: { code: "DOCUMENT_NOT_FOUND", message: error.message } };
  }
  if (error instanceof DocumentTooLargeError) {
    return { success: false, error: { code: "DOCUMENT_TOO_LARGE", message: error.message } };
  }
  if (error instanceof UnsupportedFileTypeError) {
    return { success: false, error: { code: "UNSUPPORTED_FILE_TYPE", message: error.message } };
  }
  if (error instanceof BusinessRuleError) {
    return { success: false, error: { code: "BUSINESS_RULE_VIOLATION", message: error.message } };
  }
  if (error instanceof ValidationError) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: error.message } };
  }

  throw error;
}

export interface UploadStudentDocumentActionInput {
  studentId: string;
  documentType: DocumentTypeValue;
  file: File;
}

export async function uploadStudentDocumentAction(
  input: UploadStudentDocumentActionInput
): Promise<ActionResult<StudentDocumentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission(permissionForDocumentType(input.documentType));

  try {
    const document = await uploadStudentDocument(
      {
        studentId: input.studentId,
        documentType: input.documentType,
        originalFileName: input.file.name,
        mimeType: input.file.type,
        fileSize: input.file.size,
        file: input.file,
      },
      { tenantId: authContext.tenantId, actingUserId: authContext.userId }
    );
    return { success: true, data: document };
  } catch (error) {
    return translateDocumentError(error);
  }
}

export type ReplaceStudentDocumentActionInput = UploadStudentDocumentActionInput;

export async function replaceStudentDocumentAction(
  input: ReplaceStudentDocumentActionInput
): Promise<ActionResult<StudentDocumentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission(permissionForDocumentType(input.documentType));

  try {
    const document = await replaceStudentDocument(
      {
        studentId: input.studentId,
        documentType: input.documentType,
        originalFileName: input.file.name,
        mimeType: input.file.type,
        fileSize: input.file.size,
        file: input.file,
      },
      { tenantId: authContext.tenantId, actingUserId: authContext.userId }
    );
    return { success: true, data: document };
  } catch (error) {
    return translateDocumentError(error);
  }
}

export interface DeleteStudentDocumentActionInput {
  documentId: string;
}

export async function deleteStudentDocumentAction(
  input: DeleteStudentDocumentActionInput
): Promise<ActionResult<DeleteStudentDocumentResult>> {
  const authContext = await requireAuthContext();
  await requirePermission("student.document.delete");

  try {
    const result = await deleteStudentDocument(
      { documentId: input.documentId },
      { tenantId: authContext.tenantId }
    );
    return { success: true, data: result };
  } catch (error) {
    return translateDocumentError(error);
  }
}
