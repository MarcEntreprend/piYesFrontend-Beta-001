// src/components/ui/Input.tsx
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: ReactNode;
  trailingSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leadingIcon, trailingSlot, className, id, ...props }, ref) => {
    const inputId = id ?? props.name ?? label;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex h-[52px] items-center gap-2 rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-4",
            "transition-colors duration-200",
            error ? "border-[var(--color-danger)]" : "border-[var(--color-border)] focus-within:border-[var(--color-brand)]"
          )}
        >
          {leadingIcon && <span className="text-[var(--color-text-tertiary)]">{leadingIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-full flex-1 bg-transparent text-[15px] text-[var(--color-text-primary)] outline-none",
              "placeholder:text-[var(--color-text-tertiary)]",
              className
            )}
            {...props}
          />
          {trailingSlot}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-[var(--color-danger)]">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";