// src/components/ui/IconButton.tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: "surface" | "brand" | "ghost";
  size?: "sm" | "md" | "lg";
  "aria-label": string;
}

const sizeMap = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14"
};

const variantMap = {
  surface: "bg-(--color-surface) text-(--color-text-primary) shadow-(--shadow-sm) border border-(--color-border) hover:bg-(--color-surface-hover)",
  brand: "bg-(--color-brand-soft) text-(--color-brand) hover:bg-(--color-brand-soft)/80",
  ghost: "bg-transparent text-(--color-text-secondary) hover:bg-(--color-bg-sunken)",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = "surface", size = "md", className, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-colors",
          sizeMap[size],
          variantMap[variant],
          className
        )}
        {...(props as any)} // cast pour éviter le conflit de types
      >
        {icon}
      </motion.button>
    );
  }
);
IconButton.displayName = "IconButton";