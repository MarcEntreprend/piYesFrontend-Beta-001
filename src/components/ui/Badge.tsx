// src/components/ui/Badge.tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "success" | "warning" | "danger" | "neutral";

const toneMap: Record<Tone, string> = {
  brand: "bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  neutral: "bg-[var(--color-bg-sunken)] text-[var(--color-text-secondary)]",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        toneMap[tone]
      )}
    >
      {children}
    </span>
  );
}