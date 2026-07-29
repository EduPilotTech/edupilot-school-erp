"use client";

import { useRef, useState, type DragEvent } from "react";
import clsx from "clsx";

interface FileDropzoneProps {
  accept: readonly string[];
  multiple?: boolean;
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
  label?: string;
  hint?: string;
}

// Pure presentational drag & drop + browse widget — no upload logic, no validation beyond the
// browser's native `accept` filtering on the Browse path (drag-and-drop can still deliver files
// the `accept` attribute wouldn't have offered via the file picker, since browsers don't filter
// drops the same way — the caller re-validates every file regardless).
export function FileDropzone({
  accept,
  multiple = false,
  disabled = false,
  onFilesSelected,
  label = "Drag & drop files here, or click to browse",
  hint,
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    if (disabled) return;
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) onFilesSelected(multiple ? files : files.slice(0, 1));
  }

  function handleBrowseChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) onFilesSelected(files);
    event.target.value = ""; // allow re-selecting the same file
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
      className={clsx(
        "flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors",
        disabled
          ? "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400"
          : "cursor-pointer text-zinc-600 hover:border-blue-400 hover:bg-blue-50/40",
        isDragActive && !disabled ? "border-blue-500 bg-blue-50" : "border-zinc-300"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        multiple={multiple}
        disabled={disabled}
        onChange={handleBrowseChange}
        className="hidden"
      />
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
