// src/pages/Activity.tsx
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MagnifyingGlass, Checks, Clock, WarningCircle, CaretDown } from "@phosphor-icons/react";
import { TopBar } from "@/components/ui/TopBar";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { mockTransactions } from "@/data";
import { formatHTG, formatRelativeDate, cn } from "@/lib/utils";
import { TransactionRole, type Transaction } from "@/types";
import { useTranslation } from "@/i18n/LanguageContext";

interface ConversationGroup {
  name: string;
  transactions: Transaction[];
}

function StatusIcon({ status }: { status?: Transaction["status"] }) {
  if (status === "PENDING") return <Clock size={14} weight="light" className="text-white/70" />;
  if (status === "FAILED") return <WarningCircle size={14} weight="fill" className="text-[var(--color-danger)]" />;
  return <Checks size={14} weight="bold" className="text-white/70" />;
}

export default function Activity() {
  const t = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "received" | "sent">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const conversations = useMemo<ConversationGroup[]>(() => {
    const filtered = mockTransactions.filter((txn) => {
      const matchesSearch = txn.counterpartyName.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "received" && txn.role === TransactionRole.RECEIVER) ||
        (filter === "sent" && txn.role === TransactionRole.PAYER);
      return matchesSearch && matchesFilter;
    });

    const groups = new Map<string, Transaction[]>();
    filtered.forEach((txn) => {
      const list = groups.get(txn.counterpartyName) ?? [];
      list.push(txn);
      groups.set(txn.counterpartyName, list);
    });

    return Array.from(groups.entries())
      .map(([name, transactions]) => ({
        name,
        transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }))
      .sort((a, b) => new Date(b.transactions[0].date).getTime() - new Date(a.transactions[0].date).getTime());
  }, [search, filter]);

  const toggleExpanded = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <div className="pb-8">
      <TopBar title={t.activity.title} />

      <div className="space-y-4 px-5">
        <Input placeholder={t.activity.searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} leadingIcon={<MagnifyingGlass size={18} weight="light" />} />
        <SegmentedControl
          value={filter}
          onChange={(v) => setFilter(v as typeof filter)}
          options={[
            { value: "all", label: t.activity.filterAll },
            { value: "received", label: t.activity.filterReceived },
            { value: "sent", label: t.activity.filterSent },
          ]}
        />
      </div>

      <div className="mt-4 px-5">
        {conversations.length === 0 && <p className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">{t.activity.noResults}</p>}

        <div className="space-y-2">
          {conversations.map((conversation) => {
            const isOpen = expanded.has(conversation.name);
            const last = conversation.transactions[0];
            const lastReceived = last.role === TransactionRole.RECEIVER;

            return (
              <div key={conversation.name} className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                <button onClick={() => toggleExpanded(conversation.name)} className="flex w-full items-center gap-3 p-3 text-left">
                  <Avatar name={conversation.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-(--color-text-primary)">{conversation.name}</p>
                      {conversation.transactions.length > 1 && <Badge tone="brand">{conversation.transactions.length}</Badge>}
                    </div>
                    <p className="truncate text-xs text-[var(--color-text-tertiary)]">
                      {t.transactionType[last.type]} · {formatRelativeDate(last.date)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={cn("font-mono-tabular text-sm font-bold", lastReceived ? "text-[var(--color-success)]" : "text-[var(--color-text-primary)]")}>
                      {lastReceived ? "+" : "-"}
                      {formatHTG(last.amount, { unit: "centimes" })}
                    </span>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <CaretDown size={14} weight="bold" className="text-[var(--color-text-tertiary)]" />
                    </motion.span>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                      className="border-t border-[var(--color-border)] bg-[var(--color-bg-sunken)]"
                    >
                      <div className="flex flex-col gap-2.5 p-4">
                        {conversation.transactions
                          .slice()
                          .reverse()
                          .map((txn) => {
                            const received = txn.role === TransactionRole.RECEIVER;
                            return (
                              <div key={txn.id} className={cn("flex", received ? "justify-start" : "justify-end")}>
                                <div
                                  className={cn(
                                    "max-w-[78%] rounded-2xl px-3.5 py-2.5",
                                    received
                                      ? "rounded-bl-md border border-[var(--color-border)] bg-[var(--color-surface)]"
                                      : "rounded-br-md bg-[var(--color-brand)] text-white"
                                  )}
                                >
                                  <p className={cn("text-xs", received ? "text-[var(--color-text-secondary)]" : "text-white/80")}>{txn.description}</p>
                                  <div className="mt-1 flex items-center justify-end gap-1.5">
                                    <span className="font-mono-tabular text-sm font-bold">
                                      {received ? "+" : "-"}
                                      {formatHTG(txn.amount, { unit: "centimes" })}
                                    </span>
                                  </div>
                                  <div className="mt-0.5 flex items-center justify-end gap-1">
                                    <span className={cn("text-[10px]", received ? "text-[var(--color-text-tertiary)]" : "text-white/60")}>
                                      {formatRelativeDate(txn.date)}
                                    </span>
                                    {!received && <StatusIcon status={txn.status} />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}