// src/components/ui/Toggle.tsx
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  "aria-label": string;
}

export function Toggle({ checked, onChange, ...props }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 rounded-full transition-colors duration-200",
        checked ? "bg-[var(--color-brand)]" : "bg-[var(--color-bg-sunken)] border border-[var(--color-border-strong)]"
      )}
      {...props}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </button>
  );
}