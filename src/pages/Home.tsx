// src/pages/Home.tsx
import { useEffect, useState } from "react";
import {
    PaperPlaneTilt,
    QrCode,
    Plus,
    ArrowDown,
    Bell,
    Moon,
    Sun,
    ArrowUpRight,
    ArrowDownLeft,
    ShieldCheck,
} from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { AmountDisplay } from "@/components/ui/AmountDisplay";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/i18n/LanguageContext";
import { mockUser, mockAccounts, mockTransactions, unreadNotificationsCount } from "@/data";
import { formatHTG, formatRelativeDate, maskAccountNumber } from "@/lib/utils";
import { TransactionRole } from "@/types";

function useMockFetch<T>(data: T, delay = 500) {
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), delay);
        return () => clearTimeout(timer);
    }, [delay]);
    return { data, loading };
}

export default function Home() {
    const t = useTranslation();
    const { resolvedTheme, toggle } = useTheme();
    const { showToast } = useToast();
    const { user } = useAuth();
    const currentUser = user ?? mockUser;

    const [masked, setMasked] = useState(() => localStorage.getItem("piyes-privacy") === "1");
    const { loading } = useMockFetch(currentUser);

    const toggleMasked = () => {
        setMasked((prev) => {
            localStorage.setItem("piyes-privacy", prev ? "0" : "1");
            return !prev;
        });
    };

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return t.home.greetingMorning;
        if (h < 18) return t.home.greetingAfternoon;
        return t.home.greetingEvening;
    };

    const quickActions = [
        { icon: <PaperPlaneTilt weight="bold" size={20} />, label: t.home.send, tone: "brand" as const },
        { icon: <QrCode weight="bold" size={20} />, label: t.home.receive, tone: "accent" as const },
        { icon: <Plus weight="bold" size={20} />, label: t.home.topUp, tone: "brand" as const },
        { icon: <ArrowDown weight="bold" size={20} />, label: t.home.withdraw, tone: "brand" as const },
    ];

    const notImplemented = () => showToast(t.common.comingSoonDesc, "info");

    return (
        <div className="pb-8">
            <div className="flex items-center justify-between px-5 pt-6 pb-4 safe-top">
                <div className="flex items-center gap-3">
                    <Avatar name={currentUser.name} src={currentUser.avatarUrl} verified size="md" />
                    <div>
                        <p className="text-xs text-(--color-text-tertiary)">{greeting()}</p>
                        <p className="text-[15px] font-bold text-(--color-text-primary)">
                            {currentUser.firstName ?? currentUser.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <IconButton
                        icon={resolvedTheme === "dark" ? <Sun size={18} weight="light" /> : <Moon size={18} weight="light" />}
                        aria-label="Changer de thème"
                        onClick={toggle}
                        size="sm"
                    />
                    <div className="relative">
                        <IconButton icon={<Bell size={18} weight="light" />} aria-label="Notifications" onClick={notImplemented} size="sm" />
                        {unreadNotificationsCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-accent) px-1 text-[10px] font-bold text-white">
                                {unreadNotificationsCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-5">
                {loading ? (
                    <Skeleton className="h-44 w-full" />
                ) : (
                    <Card variant="brand">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wide text-white/70">{t.home.accountHint}</span>
                            <Badge tone="neutral">
                                <span className="text-white/90">{maskAccountNumber(currentUser.accountNumber)}</span>
                            </Badge>
                        </div>

                        <p className="mt-4 text-xs text-white/70">{t.home.balanceLabel}</p>
                        <div className="mt-1">
                            <AmountDisplay amount={currentUser.balance} unit="gourdes" masked={masked} onToggleMask={toggleMasked} tone="inverse" size="xl" />
                        </div>

                        <div className="mt-5 flex items-center gap-1.5 text-[11px] text-white/75">
                            <ShieldCheck weight="fill" size={14} />
                            {t.home.verifiedFunds}
                        </div>
                    </Card>
                )}
            </div>

            <div className="mt-5 grid grid-cols-4 gap-3 px-5">
                {quickActions.map((action) => (
                    <button
                        key={action.label}
                        onClick={notImplemented}
                        className="flex flex-col items-center gap-2 rounded-lg py-3 transition-transform active:scale-95"
                    >
                        <span
                            className={
                                action.tone === "accent"
                                    ? "flex h-12 w-12 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)"
                                    : "flex h-12 w-12 items-center justify-center rounded-full bg-(--color-brand-soft) text-(--color-brand)"
                            }
                        >
                            {action.icon}
                        </span>
                        <span className="text-xs font-semibold text-(--color-text-secondary)">{action.label}</span>
                    </button>
                ))}
            </div>

            <div className="mt-7">
                <div className="flex items-center justify-between px-5">
                    <h2 className="text-sm font-bold text-(--color-text-primary)">{t.home.linkedAccounts}</h2>
                </div>
                <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-1">
                    {loading
                        ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-40 shrink-0" />)
                        : mockAccounts
                            .filter((a) => a.provider !== "piyes")
                            .map((account) => (
                                <div key={account.id} className="w-40 shrink-0 rounded-lg border border-(--color-border) bg-(--color-surface) p-3.5 shadow-(--shadow-xs)">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: account.color }}>
                                        {account.logoText}
                                    </div>
                                    <p className="mt-2.5 text-xs font-medium text-(--color-text-secondary)">{account.label}</p>
                                    <p className="mt-0.5 text-sm font-bold font-mono-tabular text-(--color-text-primary)">{formatHTG(account.balance)}</p>
                                    <div className="mt-1.5">
                                        <Badge tone={account.status === "active" ? "success" : "warning"}>
                                            {account.status === "active" ? t.home.statusActive : t.home.statusPending}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                </div>
            </div>

            <div className="mt-7 px-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-(--color-text-primary)">{t.home.recentActivity}</h2>
                    <button onClick={notImplemented} className="text-xs font-semibold text-(--color-brand)">
                        {t.common.seeAll}
                    </button>
                </div>

                <div className="mt-3 space-y-2">
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                        : mockTransactions.slice(0, 5).map((txn) => {
                            const isReceived = txn.role === TransactionRole.RECEIVER;
                            return (
                                <div key={txn.id} className="flex items-center gap-3 rounded-lg bg-(--color-surface) border border-(--color-border) p-3">
                                    <Avatar name={txn.counterpartyName} size="sm" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-(--color-text-primary)">{txn.counterpartyName}</p>
                                        <p className="text-xs text-(--color-text-tertiary)">
                                            {t.transactionType[txn.type]} · {formatRelativeDate(txn.date)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {isReceived ? (
                                            <ArrowDownLeft weight="bold" size={14} className="text-(--color-success)" />
                                        ) : (
                                            <ArrowUpRight weight="bold" size={14} className="text-(--color-danger)" />
                                        )}
                                        <span className={"font-mono-tabular text-sm font-bold " + (isReceived ? "text-(--color-success)" : "text-(--color-text-primary)")}>
                                            {isReceived ? "+" : "-"}
                                            {formatHTG(txn.amount, { unit: "centimes" })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}