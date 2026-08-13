// src/components/ui/AmountDisplay.tsx
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { formatHTG } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AmountDisplayProps {
  amount: number;
  unit?: "gourdes" | "centimes";
  masked: boolean;
  onToggleMask?: () => void;
  size?: "md" | "lg" | "xl";
  tone?: "default" | "inverse";
}

const sizeMap = { md: "text-2xl", lg: "text-3xl", xl: "text-4xl" };

export function AmountDisplay({ amount, unit = "gourdes", masked, onToggleMask, size = "xl", tone = "default" }: AmountDisplayProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "font-mono-tabular font-bold",
          sizeMap[size],
          tone === "inverse" ? "text-white" : "text-(--color-text-primary)"
        )}
      >
        {formatHTG(amount, { unit, masked })}
      </span>
      {onToggleMask && (
        <button
          onClick={onToggleMask}
          aria-label={masked ? "Afficher le solde" : "Masquer le solde"}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
            tone === "inverse" ? "bg-white/15 text-white hover:bg-white/25" : "bg-(--color-bg-sunken) text-(--color-text-secondary)"
          )}
        >
          {masked ? <EyeSlash size={16} weight="light" /> : <Eye size={16} weight="light" />}
        </button>
      )}
    </div>
  );
}