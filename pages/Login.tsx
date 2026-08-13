// pages/Login.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
    Smartphone,
    ShieldCheck,
    ChevronRight,
    ArrowLeft,
    Loader2,
} from "lucide-react";
import { useTranslation, useToast } from "../App";
import LanguageSelector from "../components/LanguageSelector";
import ThemeSelector from "../components/ThemeSelector";
import Modal from "../components/Modal";
import Button from "../components/Button";
import Input from "../components/Input";
import PageTransition from "../components/PageTransition";
import { cn } from "../src/lib/utils";
import { motion } from "motion/react";


interface LoginProps {
    onLogin: (credentials: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [comingSoonModal, setComingSoonModal] = useState(false);
    const [highlightForgot, setHighlightForgot] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const navigate = useNavigate();



    useEffect(() => {
        const handleHighlight = () => {
            setHighlightForgot(true);
            setTimeout(() => setHighlightForgot(false), 2000);
        };

        window.addEventListener("piyes:highlight_forgot_password", handleHighlight);
        return () => {
            window.removeEventListener("piyes:highlight_forgot_password", handleHighlight);
        };
    }, []);

    // connectivité 
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const validateIdentifier = (val: string) => {
        if (!val) return false;
        if (val.includes("@")) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(val) && val.length <= 320;
        }
        const phoneRegex = /^(\+509)?\d{8}$/;
        return phoneRegex.test(val.replace(/[\s\-]/g, ""));
    };

    const normalizeIdentifier = (val: string): string => {
        if (val.includes("@")) return val.trim().toLowerCase();
        const digits = val.replace(/[^\d]/g, "");
        if (digits.startsWith("509") && digits.length === 11) return "+" + digits;
        if (digits.length === 8) return "+509" + digits;
        return val.trim();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!navigator.onLine) {
            showToast(t("common.offline_msg"), "error");
            return;
        }

        if (isSubmitting) {
            setIsSubmitting(false);
            return;
        }

        // Step 1 : validation de l'identifiant → passage au step 2
        if (step === 1) {
            if (validateIdentifier(identifier)) {
                setError("");
                setStep(2);
            } else {
                const hasAt = identifier.includes("@");
                setError(
                    hasAt
                        ? "Adresse email invalide. Vérifiez le format (ex: nom@domaine.com)."
                        : "Numéro de téléphone invalide. Format attendu : 8 chiffres haïtiens.",
                );
            }
            return;
        }

        // Step 2 : soumission
        if (step === 2 && password.length >= 6) {
            setIsSubmitting(true);

            try {
                // Appeler onLogin et attendre qu'il termine (ou échoue)
                // On fait un wrapper Promise pour capturer la fin
                const normalized = normalizeIdentifier(identifier);
                const isEmail = identifier.includes("@");

                // Utiliser un pattern "fire and forget with timeout safety"
                const loginPromise = new Promise<void>((resolve, reject) => {
                    const safetyTimeout = setTimeout(() => {
                        reject(new Error("timeout"));
                    }, 15000);

                    (window as any).__loginResolve = () => {
                        clearTimeout(safetyTimeout);
                        resolve();
                    };
                    (window as any).__loginReject = (err: any) => {
                        clearTimeout(safetyTimeout);
                        reject(err);
                    };

                    onLogin({
                        [isEmail ? "email" : "phone"]: normalized,
                        password,
                        device: navigator.userAgent,
                    });
                });

                await loginPromise;
            } catch (err: any) {
                // L'erreur est déjà gérée par le toast dans App.tsx
                // On reset juste l'état local
            } finally {
                setIsSubmitting(false);
                // Nettoyer les callbacks globaux
                delete (window as any).__loginResolve;
                delete (window as any).__loginReject;
                if ((window as any).__loginSafetyTimeout) {
                    clearTimeout((window as any).__loginSafetyTimeout);
                    delete (window as any).__loginSafetyTimeout;
                }
            }
        }
    };

    const handleForgotPassword = () => {
        navigate("/forgot-password", { state: { identifier } });
    };

    const getGreeting = (): string => {
        // Utiliser directement la clé de traduction
        return t("auth.greeting_fixed");
    };

    return (
        <PageTransition direction="left" className="min-h-screen theme-card-bg flex flex-col px-8 pt-12">
            {/* Top bar */}
            <div className="mb-10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {step === 2 && (
                        <motion.button
                            whileHover={{ x: -2, scale: 1.05 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                setStep(1);
                                setPassword("");
                                setError("");
                            }}
                            className="theme-text-main p-2 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </motion.button>
                    )}
                    <h1 className="theme-primary-text text-3xl font-black italic tracking-tighter">
                        piYès
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeSelector />
                    <LanguageSelector />
                </div>
            </div>

            {/* Hero text — only on step 1 */}
            {step === 1 && (
                <div className="mb-10 space-y-2 animate-in slide-in-from-top duration-500">
                    <h2 className="text-[28px] font-black theme-text-main leading-tight tracking-tight">
                        {t("auth.hero_prefix")}
                        <br />
                        <span className="theme-primary-text">{t("auth.hero_highlight")}</span>{" "}
                        {t("auth.hero_suffix_normal")}{" "}
                        <span className="theme-primary-text">{t("auth.hero_suffix_highlight")}</span>
                    </h2>
                    <p className="text-sm theme-text-secondary font-medium">
                        {t("auth.hero_subtitle")}
                    </p>
                </div>
            )}

            <div className="flex-1">
                <h3 className="text-xl font-black theme-text-main mb-6 animate-in slide-in-from-left duration-300 tracking-tight">
                    {step === 1
                        ? `${getGreeting()}${t("auth.login_greeting_text")}`
                        : t("auth.password_prompt")
                    }
                </h3>
                {isOffline && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl flex items-center gap-2 text-red-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                        <p className="text-xs font-bold">{t("common.no_internet")}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {step === 1 ? (
                        <Input
                            label="Email ou téléphone"
                            autoFocus
                            type="text"
                            value={identifier}
                            onChange={(e) => {
                                setIdentifier(e.target.value);
                                if (error) setError("");
                            }}
                            onPaste={(e) => {
                                // Valider après collage (délai pour laisser la valeur se mettre à jour)
                                const pastedValue = e.clipboardData?.getData('text') || '';
                                setTimeout(() => {
                                    const currentValue = (e.target as HTMLInputElement).value || pastedValue;
                                    if (currentValue && !validateIdentifier(currentValue)) {
                                        const hasAt = currentValue.includes("@");
                                        setError(
                                            hasAt
                                                ? "Adresse email invalide. Vérifiez le format (ex: nom@domaine.com)."
                                                : "Numéro de téléphone invalide. Format attendu : 8 chiffres haïtiens."
                                        );
                                    }
                                }, 50);
                            }}
                            onBlur={() => {
                                if (identifier.trim() && !validateIdentifier(identifier)) {
                                    const hasAt = identifier.includes("@");
                                    setError(
                                        hasAt
                                            ? "Adresse email invalide. Vérifiez le format."
                                            : "Numéro invalide. 8 chiffres attendus."
                                    );
                                }
                            }}
                            error={error}
                            required
                        />
                    ) : (
                        <div className="space-y-4">
                            {/* Show who is logging in */}
                            <div className="flex items-center gap-3 p-3 theme-bubble-bg rounded-2xl border theme-border">
                                <div className="w-8 h-8 theme-primary-bg rounded-full flex items-center justify-center text-white text-xs font-black">
                                    {identifier.includes("@")
                                        ? identifier[0].toUpperCase()
                                        : "📱"}
                                </div>
                                <p className="text-sm font-bold theme-text-main truncate">
                                    {identifier}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Input
                                    label={t("auth.password_placeholder")}
                                    autoFocus
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <p className="text-[10px] theme-text-secondary font-bold uppercase tracking-widest px-2">
                                    {t("auth.signup_pass_hint")}
                                </p>
                            </div>
                            <motion.div
                                animate={highlightForgot ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ duration: 0.6, repeat: highlightForgot ? 6 : 0 }}
                            >
                                <Button
                                    type="button"
                                    variant={highlightForgot ? "primary" : "text"}
                                    size="sm"
                                    onClick={handleForgotPassword}
                                    className={cn(
                                        "uppercase tracking-widest transition-all duration-300",
                                        highlightForgot && "shadow-lg"
                                    )}
                                >
                                    {t("auth.forgot_password")}
                                </Button>
                            </motion.div>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-xs theme-text-secondary font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-green-500" />
                            {/* {t("auth.secure_access")} */}
                        </span>
                    </div>
                </form>

                {/* Social login — only on step 1 */}
                {step === 1 && (
                    <div className="mt-8 space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 theme-border border-t" />
                            <span className="text-[10px] font-black theme-text-secondary uppercase tracking-[0.2em]">
                                {t("auth.signup_social_or")}
                            </span>
                            <div className="h-px flex-1 theme-border border-t" />
                        </div>
                        <div className="flex justify-center gap-4">
                            <div className="flex-1 max-w-40">
                                <Button
                                    type="button"
                                    variant="utility"
                                    onClick={() => setComingSoonModal(true)}
                                    leftIcon={
                                        <img
                                            src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                                            alt=""
                                            className="w-5 h-5 grayscale"
                                        />
                                    }
                                    className="w-full"
                                >
                                    Google
                                </Button>
                            </div>
                            <div className="flex-1 max-w-40">
                                <Button
                                    type="button"
                                    variant="utility"
                                    onClick={() => setComingSoonModal(true)}
                                    leftIcon={
                                        <img
                                            src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
                                            alt=""
                                            className="w-5 h-5 dark:invert"
                                        />
                                    }
                                    className="w-full"
                                >
                                    Apple
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="pb-12 flex flex-col gap-4 mt-8">
                <Button
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    disabled={step === 2 && password.length < 6}
                    fullWidth
                    rightIcon={!isSubmitting ? <ChevronRight size={20} /> : undefined}
                    className="uppercase tracking-widest"
                >
                    {t("common.continue")}
                </Button>
                <div className="flex justify-center">
                    <Button
                        variant="text"
                        onClick={() => navigate("/signup")}
                        className="theme-text-secondary"
                    >
                        {t("auth.no_account")}
                    </Button>
                </div>
            </div>

            {/* Coming Soon Modal */}
            <Modal
                isOpen={comingSoonModal}
                onClose={() => setComingSoonModal(false)}
                type="centered"
            >
                <div className="p-8 space-y-6 text-center animate-in zoom-in duration-300">
                    <div className="text-4xl">🚀</div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black theme-text-main">
                            Bientôt disponible
                        </h3>
                        <p className="text-sm theme-text-secondary">
                            La connexion via Google et Apple sera disponible prochainement.
                            Utilisez votre email ou téléphone pour le moment.
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={() => setComingSoonModal(false)}
                    >
                        Compris 👍
                    </Button>
                </div>
            </Modal>
        </PageTransition>
    );
};

export default Login;