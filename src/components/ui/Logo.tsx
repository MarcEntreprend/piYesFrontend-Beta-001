// src/components/ui/Logo.tsx
import { cn } from "@/lib/utils";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "h-8 w-8 text-sm", md: "h-11 w-11 text-lg", lg: "h-16 w-16 text-2xl" };
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn("flex items-center justify-center rounded-2xl font-extrabold text-white shadow-[var(--shadow-brand)]", dims[size])}
        style={{ backgroundImage: "var(--gradient-brand)" }}
      >
        P
      </div>
      <span className="text-xl font-extrabold tracking-tight text-[var(--color-text-primary)]">piYès</span>
    </div>
  );
}