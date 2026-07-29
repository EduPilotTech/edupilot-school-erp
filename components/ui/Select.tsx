import { forwardRef, type SelectHTMLAttributes } from "react";
import clsx from "clsx";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { hasError, options, placeholder, className, ...rest },
  ref
) {
  return (
    <select
      ref={ref}
      aria-invalid={hasError || undefined}
      className={clsx(
        "rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40",
        hasError ? "border-red-400" : "border-zinc-300 focus:border-blue-500",
        "disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500",
        className
      )}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});
