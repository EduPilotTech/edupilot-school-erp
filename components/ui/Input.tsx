import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

// forwardRef so react-hook-form's register() can attach its own ref directly, matching the
// standard react-hook-form + uncontrolled-input integration pattern.
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { hasError, className, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      aria-invalid={hasError || undefined}
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
