// src/layouts/AuthLayout.tsx
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="relative mx-auto min-h-dvh max-w-md overflow-hidden bg-[var(--color-bg)]">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-brand) 0%, transparent 70%)" }}
      />
      <div className="safe-top relative px-6 pt-10 pb-8">
        <Logo size="md" />
        <h1 className="mt-8 text-2xl font-extrabold text-[var(--color-text-primary)]">{title}</h1>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
        <div className="mt-8 safe-bottom">{children}</div>
      </div>
    </div>
  );
}