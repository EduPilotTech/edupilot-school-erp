"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiFile, FiFileText, FiImage, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { DOCUMENT_TYPE_LABELS, allowedMimeTypesForDocumentType, formatFileSize } from "./document-type-options";
import { StudentDocumentPreview } from "./student-document-preview";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { replaceStudentDocumentAction, deleteStudentDocumentAction } from "../../documents/actions";
import type { StudentDocumentListItemDTO } from "@/modules/students/application/dto/student-document.dto";

interface StudentDocumentListProps {
  studentId: string;
  documents: StudentDocumentListItemDTO[];
  canUpload: boolean;
  canDelete: boolean;
}

function iconFor(mimeType: string) {
  if (mimeType.startsWith("image/")) return <FiImage aria-hidden="true" className="h-5 w-5 text-blue-500" />;
  if (mimeType === "application/pdf") return <FiFileText aria-hidden="true" className="h-5 w-5 text-red-500" />;
  return <FiFile aria-hidden="true" className="h-5 w-5 text-zinc-400" />;
}

// Excludes PHOTO — the photo has its own dedicated widget (StudentPhotoUploader), not a row here.
export function StudentDocumentList({ studentId, documents, canUpload, canDelete }: StudentDocumentListProps) {
  const router = useRouter();
  const visibleDocuments = documents.filter((doc) => doc.documentType !== "PHOTO");

  const [previewDoc, setPreviewDoc] = useState<StudentDocumentListItemDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentDocumentListItemDTO | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<StudentDocumentListItemDTO | null>(null);

  function startReplace(doc: StudentDocumentListItemDTO) {
    setReplaceTarget(doc);
    setRowError(null);
    // Defer to the next tick so the input's `accept` (set from replaceTarget) is applied first.
    requestAnimationFrame(() => replaceInputRef.current?.click());
  }

  async function handleReplaceFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !replaceTarget) return;

    const allowed = allowedMimeTypesForDocumentType(replaceTarget.documentType);
    if (!allowed.includes(file.type)) {
      setRowError({ id: replaceTarget.id, message: `${file.type || "This file type"} is not accepted.` });
      return;
    }

    setReplacingId(replaceTarget.id);
    const result = await replaceStudentDocumentAction({
      studentId,
      documentType: replaceTarget.documentType,
      file,
    });
    setReplacingId(null);

    if (!result.success) {
      setRowError({ id: replaceTarget.id, message: result.error.message });
      return;
    }

    router.refresh();
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const result = await deleteStudentDocumentAction({ documentId: deleteTarget.id });
    setDeleteTarget(null);
    if (!result.success) {
      setRowError({ id: deleteTarget.id, message: result.error.message });
      return;
    }
    router.refresh();
  }

  if (visibleDocuments.length === 0) {
    return <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">No documents uploaded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <input
        ref={replaceInputRef}
        type="file"
        accept={replaceTarget ? allowedMimeTypesForDocumentType(replaceTarget.documentType).join(",") : undefined}
        className="hidden"
        onChange={handleReplaceFileChosen}
      />

      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="py-2 pr-4"></th>
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Size</th>
            <th className="py-2 pr-4">Uploaded</th>
            <th className="py-2 pr-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleDocuments.map((doc) => (
            <tr key={doc.id} className="border-b border-zinc-100 last:border-0">
              <td className="py-2 pr-4">{iconFor(doc.mimeType)}</td>
              <td className="py-2 pr-4 max-w-[220px] truncate text-zinc-900" title={doc.originalFileName}>
                {doc.originalFileName}
              </td>
              <td className="py-2 pr-4 text-zinc-600">{DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}</td>
              <td className="py-2 pr-4 text-zinc-600">{formatFileSize(doc.fileSize)}</td>
              <td className="py-2 pr-4 text-zinc-600">{doc.createdAt.toLocaleDateString()}</td>
              <td className="py-2 pr-4">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="text-zinc-500 hover:text-blue-600"
                    aria-label={`Preview ${doc.originalFileName}`}
                  >
                    <FiEye className="h-4 w-4" />
                  </button>
                  {canUpload && (
                    <button
                      type="button"
                      onClick={() => startReplace(doc)}
                      disabled={replacingId === doc.id}
                      className="text-zinc-500 hover:text-blue-600 disabled:opacity-50"
                      aria-label={`Replace ${doc.originalFileName}`}
                    >
                      <FiRefreshCw className={`h-4 w-4 ${replacingId === doc.id ? "animate-spin" : ""}`} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(doc)}
                      className="text-zinc-500 hover:text-red-600"
                      aria-label={`Delete ${doc.originalFileName}`}
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {rowError?.id === doc.id && (
                  <p className="mt-1 text-right text-xs text-red-600">{rowError.message}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {previewDoc && <StudentDocumentPreview document={previewDoc} onClose={() => setPreviewDoc(null)} />}

      {deleteTarget && (
        <DeleteConfirmationDialog
          title="Delete document"
          message={`Are you sure you want to delete "${deleteTarget.originalFileName}"? This cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
