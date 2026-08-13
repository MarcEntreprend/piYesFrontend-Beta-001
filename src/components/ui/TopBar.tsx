// src/components/ui/TopBar.tsx
import type { ReactNode } from "react";
import { CaretLeft } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { IconButton } from "./IconButton";

interface TopBarProps {
  title: string;
  showBack?: boolean;
  rightSlot?: ReactNode;
}

export function TopBar({ title, showBack, rightSlot }: TopBarProps) {
  const navigate = useNavigate();
  return (
    <header className="safe-top sticky top-0 z-30 flex items-center justify-between gap-3 bg-[var(--color-bg)]/90 backdrop-blur-md px-5 py-4">
      <div className="flex items-center gap-3">
        {showBack && (
          <IconButton
            icon={<CaretLeft size={18} weight="bold" />}
            aria-label="Retour"
            onClick={() => navigate(-1)}
            size="sm"
          />
        )}
        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h1>
      </div>
      {rightSlot}
    </header>
  );
}