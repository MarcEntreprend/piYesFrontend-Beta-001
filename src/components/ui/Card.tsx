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
 * variant="brand" utilise --gradient-brand (défini dans index.css),
 * jamais de hex codé en dur ici — le dégradé change automatiquement en dark mode.
 */
export function Card({ variant = "elevated", className, children, style, ...props }: CardProps) {
  if (variant === "brand") {
    return (
      <div
        className={cn("rounded-[var(--radius-2xl)] p-1.5 shadow-[var(--shadow-brand)]", className)}
        style={{ backgroundImage: "var(--gradient-brand)", ...style }}
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
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}