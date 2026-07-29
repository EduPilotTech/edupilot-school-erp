import { forwardRef, type InputHTMLAttributes } from "react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, id, ...rest },
  ref
) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-zinc-700">
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500/40"
        {...rest}
      />
      {label}
    </label>
  );
});
