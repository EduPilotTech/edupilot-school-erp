"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCamera, FiTrash2 } from "react-icons/fi";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_FILE_SIZE_BYTES, formatFileSize } from "./document-type-options";
import { StudentDocumentPreview } from "./student-document-preview";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import {
  uploadStudentDocumentAction,
  replaceStudentDocumentAction,
  deleteStudentDocumentAction,
} from "../../documents/actions";
import type { StudentDocumentListItemDTO } from "@/modules/students/application/dto/student-document.dto";

interface StudentPhotoUploaderProps {
  studentId: string;
  fullName: string;
  photo: StudentDocumentListItemDTO | null;
  canUpload: boolean;
  canDelete: boolean;
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return `${parts[0]?.charAt(0) ?? ""}${parts[parts.length - 1]?.charAt(0) ?? ""}`.toUpperCase();
}

// Upload / Replace / Delete / Preview for the student's PHOTO document specifically — a
// dedicated, avatar-shaped widget rather than a row in StudentDocumentList (which deliberately
// excludes PHOTO). Replaces the static initials-only avatar OverviewCard rendered before this
// sprint — now backed by a real StudentDocument (documentType = PHOTO) instead of the unused
// `Student.photoUrl` column (see modules/students/application/dto/student-profile.dto.ts's
// comment on why that column has never been written to).
export function StudentPhotoUploader({ studentId, fullName, photo, canUpload, canDelete }: StudentPhotoUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      setError(`${file.type || "This file type"} is not an accepted image type.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Photo exceeds the ${formatFileSize(MAX_FILE_SIZE_BYTES)} limit.`);
      return;
    }

    setIsSubmitting(true);
    const action = photo ? replaceStudentDocumentAction : uploadStudentDocumentAction;
    const result = await action({ studentId, documentType: "PHOTO", file });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!photo) return;
    const result = await deleteStudentDocumentAction({ documentId: photo.id });
    setShowDeleteConfirm(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChosen}
      />

      <div className="group relative h-24 w-24 flex-shrink-0">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL from Supabase Storage.
          <img
            src={photo.signedUrl}
            alt={fullName}
            onClick={() => setShowPreview(true)}
            className="h-24 w-24 cursor-pointer rounded-full border border-zinc-200 object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-2xl font-semibold text-zinc-500">
            {initials(fullName)}
          </div>
        )}

        {canUpload && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isSubmitting}
            aria-label={photo ? "Replace photo" : "Upload photo"}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:text-blue-600 disabled:opacity-60"
          >
            <FiCamera className="h-4 w-4" />
          </button>
        )}

        {photo && canDelete && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            aria-label="Delete photo"
            className="absolute -bottom-1 -left-1 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:text-red-600"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {isSubmitting && <p className="text-xs text-zinc-500">Uploading…</p>}
      {error && <p className="max-w-[10rem] text-center text-xs text-red-600">{error}</p>}

      {showPreview && photo && (
        <StudentDocumentPreview document={photo} onClose={() => setShowPreview(false)} />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmationDialog
          title="Delete photo"
          message="Are you sure you want to delete this student's photo? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
