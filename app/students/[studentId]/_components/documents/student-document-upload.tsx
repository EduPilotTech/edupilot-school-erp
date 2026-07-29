"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileDropzone } from "./file-dropzone";
import { Select } from "@/components/ui/Select";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  CERTIFICATE_DOCUMENT_TYPE_OPTIONS,
  MAX_FILE_SIZE_BYTES,
  allowedMimeTypesForDocumentType,
  formatFileSize,
} from "./document-type-options";
import { uploadStudentDocumentAction } from "../../documents/actions";
import type { DocumentTypeValue } from "@/modules/students/domain/student-document.entity";

interface QueueItem {
  id: string;
  file: File;
  documentType: DocumentTypeValue;
  status: "queued" | "uploading" | "success" | "error";
  message?: string;
}

interface StudentDocumentUploadProps {
  studentId: string;
}

// Multiple Upload + Progress Indicator: files are queued client-side (each with its own,
// independently-editable Document Type), then uploaded one at a time through the existing
// uploadStudentDocumentAction — sequentially, not in parallel, so two files of the same
// documentType in one batch don't race the server's "one active document per type" check.
// "Progress" here is per-file queued/uploading/success/error status, not a byte-level percentage
// — Server Actions don't expose upload progress events the way a raw XHR/fetch stream would, and
// building that would mean adding new backend surface, out of this step's scope ("do not
// redesign the backend").
export function StudentDocumentUpload({ studentId }: StudentDocumentUploadProps) {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  function addFiles(files: File[]) {
    const newItems: QueueItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      documentType: "OTHER",
      status: "queued",
    }));
    setQueue((prev) => [...prev, ...newItems]);
  }

  function updateItemType(id: string, documentType: DocumentTypeValue) {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, documentType } : item)));
  }

  function removeItem(id: string) {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }

  function validateItem(item: QueueItem): string | null {
    const allowed = allowedMimeTypesForDocumentType(item.documentType);
    if (!allowed.includes(item.file.type)) {
      return `${item.file.type || "This file type"} is not accepted for ${item.documentType}.`;
    }
    if (item.file.size > MAX_FILE_SIZE_BYTES) {
      return `File exceeds the ${formatFileSize(MAX_FILE_SIZE_BYTES)} limit.`;
    }
    return null;
  }

  async function handleUploadAll() {
    setIsUploading(true);

    for (const item of queue) {
      if (item.status === "success") continue;

      const validationError = validateItem(item);
      if (validationError) {
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "error", message: validationError } : q))
        );
        continue;
      }

      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "uploading" } : q)));

      const result = await uploadStudentDocumentAction({
        studentId,
        documentType: item.documentType,
        file: item.file,
      });

      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? result.success
              ? { ...q, status: "success", message: undefined }
              : { ...q, status: "error", message: result.error.message }
            : q
        )
      );
    }

    setIsUploading(false);
    router.refresh();
  }

  const hasQueuedWork = queue.some((item) => item.status !== "success");

  return (
    <div className="flex flex-col gap-4">
      <FileDropzone
        accept={ALLOWED_DOCUMENT_MIME_TYPES}
        multiple
        disabled={isUploading}
        onFilesSelected={addFiles}
        label="Drag & drop documents here, or click to browse"
        hint={`PDF or image, up to ${formatFileSize(MAX_FILE_SIZE_BYTES)} each`}
      />

      {queue.length > 0 && (
        <ul className="flex flex-col gap-2">
          {queue.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              <span className="flex-1 truncate font-medium text-zinc-900">{item.file.name}</span>
              <span className="text-xs text-zinc-500">{formatFileSize(item.file.size)}</span>

              <Select
                aria-label={`Document type for ${item.file.name}`}
                options={CERTIFICATE_DOCUMENT_TYPE_OPTIONS as unknown as { value: string; label: string }[]}
                value={item.documentType}
                disabled={item.status === "uploading" || item.status === "success"}
                onChange={(event) => updateItemType(item.id, event.target.value as DocumentTypeValue)}
                className="w-48"
              />

              <StatusBadge status={item.status} message={item.message} />

              {item.status !== "uploading" && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-xs text-zinc-400 hover:text-red-600"
                  aria-label={`Remove ${item.file.name} from queue`}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {queue.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleUploadAll}
            disabled={isUploading || !hasQueuedWork}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? "Uploading…" : "Upload All"}
          </button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, message }: { status: QueueItem["status"]; message?: string }) {
  const styles: Record<QueueItem["status"], string> = {
    queued: "bg-zinc-100 text-zinc-600 border-zinc-300",
    uploading: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    error: "bg-red-50 text-red-700 border-red-200",
  };
  const text: Record<QueueItem["status"], string> = {
    queued: "Queued",
    uploading: "Uploading…",
    success: "Uploaded",
    error: message ?? "Failed",
  };

  return (
    <span
      title={message}
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {text[status]}
    </span>
  );
}
