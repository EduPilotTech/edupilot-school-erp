import { forwardRef, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { hasError, className, ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={hasError || undefined}
      rows={3}
      className={clsx(
        "rounded-lg border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40",
        hasError ? "border-red-400" : "border-zinc-300 focus:border-blue-500",
        "disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500",
        className
      )}
      {...rest}
    />
  );
});
