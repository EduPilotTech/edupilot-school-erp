"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/document-validation";
import { uploadBrandingAssetAction, removeBrandingAssetAction } from "@/app/settings/branding/actions";
import type { BrandingAssetType } from "@/modules/branding/domain/school-branding.entity";

interface BrandingAssetUploaderProps {
  assetType: BrandingAssetType;
  label: string;
  currentUrl: string | null;
  canManage: boolean;
  shape?: "square" | "wide";
}

function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Generalized version of app/students/[studentId]/_components/documents/student-photo-uploader.tsx
// for the three branding image assets (logo/signature/seal) — same hidden-input + client-side
// MIME/size pre-check + direct Server Action call pattern, generalized from a circular avatar to
// a plain image tile since these assets aren't headshots.
export function BrandingAssetUploader({ assetType, label, currentUrl, canManage, shape = "square" }: BrandingAssetUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);

    const allowedTypes: readonly string[] = ALLOWED_IMAGE_MIME_TYPES;
    if (!allowedTypes.includes(file.type)) {
      setError(`${file.type || "This file type"} is not an accepted image type.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File exceeds the ${formatFileSize(MAX_FILE_SIZE_BYTES)} limit.`);
      return;
    }

    setIsSubmitting(true);
    const result = await uploadBrandingAssetAction({ assetType, file });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }
    router.refresh();
  }

  async function handleRemove() {
    setIsSubmitting(true);
    const result = await removeBrandingAssetAction(assetType);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    router.refresh();
  }

  const dimensionClass = shape === "square" ? "h-24 w-24" : "h-20 w-40";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-zinc-500">{label}</p>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChosen}
      />

      <div className={`flex ${dimensionClass} items-center justify-center overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-50`}>
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL from Supabase Storage.
          <img src={currentUrl} alt={label} className="h-full w-full object-contain" />
        ) : (
          <span className="px-2 text-center text-xs text-zinc-400">No {label.toLowerCase()}</span>
        )}
      </div>

      {canManage && (
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isSubmitting}
            className="text-blue-600 hover:underline disabled:opacity-50"
          >
            {currentUrl ? "Replace" : "Upload"}
          </button>
          {currentUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isSubmitting}
              className="text-red-600 hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {isSubmitting && <p className="text-xs text-zinc-500">Working…</p>}
      {error && <p className="max-w-[12rem] text-xs text-red-600">{error}</p>}
    </div>
  );
}
