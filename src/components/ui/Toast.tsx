// src/components/ui/Toast.tsx
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, Info, WarningCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "info" | "warning";
interface ToastItem {
    id: number;
    message: string;
    tone: ToastTone;
}

interface ToastContextValue {
    showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const iconMap: Record<ToastTone, ReactNode> = {
    success: <CheckCircle weight="fill" size={18} className="text-(--color-success)" />,
    info: <Info weight="fill" size={18} className="text-(--color-brand)" />,
    warning: <WarningCircle weight="fill" size={18} className="text-(--color-warning)" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((message: string, tone: ToastTone = "info") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, tone }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 2800);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                            className={cn(
                                "flex items-center gap-2 rounded-full bg-(--color-bg-elevated) border border-(--color-border)",
                                "px-4 py-2.5 shadow-(--shadow-md) text-sm font-medium text-(--color-text-primary)",
                                "max-w-[92vw]"
                            )}
                        >
                            {iconMap[toast.tone]}
                            {toast.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast doit être utilisé dans un <ToastProvider>");
    return ctx;
}