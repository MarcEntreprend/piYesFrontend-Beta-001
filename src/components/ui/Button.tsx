// src/components/ui/Button.tsx

import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

// Utiliser HTMLMotionProps au lieu de Omit<ButtonHTMLAttributes...>
interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children" | "ref"> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children?: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-(--color-brand) text-(--color-text-inverse) shadow-(--shadow-brand) hover:bg-(--color-brand-strong)",
  accent:
    "bg-(--color-accent) text-white shadow-(--shadow-accent) hover:bg-(--color-accent-strong)",
  secondary:
    "bg-(--color-brand-soft) text-(--color-brand) hover:brightness-95",
  ghost:
    "bg-transparent text-(--color-text-primary) hover:bg-(--color-bg-sunken)",
  danger:
    "bg-(--color-danger-soft) text-(--color-danger) hover:brightness-95",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-12 px-6 text-[15px] gap-2",
  lg: "h-14 px-7 text-base gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth,
      loading,
      leadingIcon,
      trailingIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold transition-colors duration-200",
          "disabled:opacity-50 disabled:pointer-events-none select-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <>
            {leadingIcon}
            {children}
            {trailingIcon && (
              <span className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/10">
                {trailingIcon}
              </span>
            )}
          </>
        )}
      </motion.button>
    );
  }
);
Button.displayName = "Button";