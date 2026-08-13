// src/components/ui/SegmentedControl.tsx
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className="inline-flex rounded-full bg-[var(--color-bg-sunken)] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative z-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
            value === option.value ? "text-[var(--color-text-inverse)]" : "text-[var(--color-text-secondary)]"
          )}
        >
          {value === option.value && (
            <motion.span
              layoutId="segmented-pill"
              className="absolute inset-0 -z-10 rounded-full bg-[var(--color-brand)]"
              transition={{ type: "spring", stiffness: 500, damping: 34 }}
            />
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}