// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un montant HTG.
 * ATTENTION intégration Supabase : l'OpenAPI documente deux unités différentes :
 * - User.balance / Account.balance → gourdes décimales (ex: 15250.75)
 * - Transaction.amount / TransferRequest.amount → CENTIMES entiers (ex: 1525075)
 * Toujours préciser `unit` pour éviter un montant x100 en prod.
 */
export function formatHTG(
  amount: number,
  opts: { unit?: "gourdes" | "centimes"; masked?: boolean } = {}
): string {
  const { unit = "gourdes", masked = false } = opts;
  if (masked) return "••••••";

  const value = unit === "centimes" ? amount / 100 : amount;
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  const sign = value < 0 ? "-" : "";
  return `${sign}${formatted} HTG`;
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffH / 24);

  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffDays === 0) return `Aujourd'hui, ${time}`;
  if (diffDays === 1) return `Hier, ${time}`;
  if (diffDays < 7) return date.toLocaleDateString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function maskAccountNumber(accountNumber: string): string {
  const clean = accountNumber.replace(/\s|-/g, "");
  const last4 = clean.slice(-4);
  return `•••• ${last4}`;
}