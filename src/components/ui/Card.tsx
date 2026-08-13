// src/components/ui/Card.tsx

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "flat" | "elevated" | "brand";
  children: ReactNode;
}

/**
 * Architecture "double-bezel" : coque extérieure fine + noyau intérieur,
 * pour un effet de carte "physique" plutôt que plate.
 */
export function Card({ variant = "elevated", className, children, ...props }: CardProps) {
  if (variant === "brand") {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-2xl)] p-1.5",
          "bg-gradient-to-br from-[var(--color-brand)] via-[#128c7e] to-[#1aa79a]",
          "shadow-[var(--shadow-brand)]",
          className
        )}
        {...props}
      >
        <div className="rounded-[calc(var(--radius-2xl)-6px)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] p-4",
        variant === "elevated" && "shadow-[var(--shadow-sm)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}