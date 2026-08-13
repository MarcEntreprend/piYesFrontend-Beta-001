// src/components/ui/BottomNav.tsx
import { House, ClockCounterClockwise, QrCode, CreditCard, User } from "@phosphor-icons/react";
import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useToast } from "./Toast";
import { useTranslation } from "@/i18n/LanguageContext";

interface NavItem {
    key: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    implemented: boolean;
}

export function BottomNav() {
    const t = useTranslation();
    const { showToast } = useToast();

    const items: NavItem[] = [
        { key: "home", label: t.nav.home, icon: <House weight="light" size={22} />, path: "/", implemented: true },
        { key: "activity", label: t.nav.activity, icon: <ClockCounterClockwise weight="light" size={22} />, path: "/activity", implemented: true },
        { key: "cards", label: t.nav.cards, icon: <CreditCard weight="light" size={22} />, path: "/cards", implemented: false },
        { key: "profile", label: t.nav.profile, icon: <User weight="light" size={22} />, path: "/profile", implemented: false },
    ];

    const handleClick = (item: NavItem, e: React.MouseEvent) => {
        if (!item.implemented) {
            e.preventDefault();
            showToast(t.common.comingSoonDesc, "info");
        }
    };

    return (
        <nav className="safe-bottom sticky bottom-0 z-30 border-t border-(--color-border) bg-(--color-bg-elevated)/95 backdrop-blur-md">
            <div className="relative mx-auto flex max-w-md items-center justify-between px-4 pt-2 pb-1">
                {items.slice(0, 2).map((item) => (
                    <NavLink
                        key={item.key}
                        to={item.path}
                        onClick={(e) => handleClick(item, e)}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium transition-colors",
                                isActive && item.implemented ? "text-(--color-brand)" : "text-(--color-text-tertiary)"
                            )
                        }
                    >
                        {item.icon}
                        {item.label}
                    </NavLink>
                ))}

                <div className="flex flex-1 justify-center">
                    <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => showToast(t.common.comingSoonDesc, "info")}
                        aria-label={t.nav.qr}
                        className={cn(
                            "flex h-14 w-14 -translate-y-4 items-center justify-center rounded-full",
                            "bg-linear-to-br from-(--color-accent) to-(--color-accent-strong)",
                            "shadow-(--shadow-accent) text-white"
                        )}
                    >
                        <QrCode weight="bold" size={24} />
                    </motion.button>
                </div>

                {items.slice(2).map((item) => (
                    <NavLink
                        key={item.key}
                        to={item.path}
                        onClick={(e) => handleClick(item, e)}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium transition-colors",
                                isActive && item.implemented ? "text-(--color-brand)" : "text-(--color-text-tertiary)"
                            )
                        }
                    >
                        {item.icon}
                        {item.label}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}