interface FileInputProps {
  id: string;
  selectedFileName?: string;
  onFileSelected: (file: File | undefined) => void;
  hasError?: boolean;
  accept?: string;
}

// Plain file input styled to match the rest of the form. Deliberately uncontrolled at the DOM
// level (file inputs can't have their displayed value set programmatically) — the selected
// filename is shown from form state (`selectedFileName`), not from the input itself.
export function FileInput({ id, selectedFileName, onFileSelected, hasError, accept }: FileInputProps) {
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor={id}
        className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 ${
          hasError ? "border-red-400" : "border-zinc-300"
        }`}
      >
        Choose file
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => onFileSelected(event.target.files?.[0])}
      />
      <span className="truncate text-sm text-zinc-500">
        {selectedFileName ?? "No file selected"}
      </span>
    </div>
  );
}
