// src/components/ui/Avatar.tsx
import { CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/types";

interface AvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  verified?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export function Avatar({ name, src, size = "md", verified, className }: AvatarProps) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full overflow-hidden font-bold",
          "bg-(--color-brand-soft) text-[var(--color-brand-strong)]",
          sizeMap[size]
        )}
      >
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>
      {verified && (
        <CheckCircle
          weight="fill"
          className="absolute -bottom-0.5 -right-0.5 h-4 w-4 text-(--color-brand) bg-(--color-bg) rounded-full"
        />
      )}
    </div>
  );
}