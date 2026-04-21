// pages/Signup.tsx

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
    ArrowLeft,
    ChevronRight,
    User,
    Mail,
    Smartphone,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    ShieldCheck,
    Loader2,
    X,
    Info,
    FileText,
    Shield,
    Building2,
    UserRound,
    MapPin,
    Briefcase,
    CreditCard,
    Users,
} from "lucide-react";
import { useTranslation, useToast } from "../App";
import { api } from "../services/apiService";
import Modal from "../components/Modal";
import Button from "../components/Button";
import LanguageSelector from "../components/LanguageSelector";
import ThemeSelector from "../components/ThemeSelector";
import SegmentedControl from "../components/SegmentedControl";
import PageTransition from "../components/PageTransition";
import { motion } from "motion/react";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const toTitleCase = (str: string): string =>
    str
        .trim()
        .replace(
            /\w\S*/g,
            (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
        );

const toLower = (str: string): string => str.trim().toLowerCase();

// ─── InputField ──────────────────────────────────────────────────────────────
interface InputFieldProps {
    icon: React.ReactNode;
    label: string;
    name: string;
    type: string;
    placeholder: string;
    isValid: boolean | null;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    showPasswordToggle?: boolean;
    onTogglePassword?: () => void;
    isPasswordVisible?: boolean;
    showValidationErrors?: boolean;
    required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
    icon,
    label,
    name,
    type,
    placeholder,
    isValid,
    value,
    onChange,
    showPasswordToggle,
    onTogglePassword,
    isPasswordVisible,
    showValidationErrors,
    required,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = String(value).length > 0;
    const isFloated = isFocused || hasValue || placeholder;

    return (
        <div className="space-y-1 w-full relative">
            <div className="flex justify-end items-center px-1 absolute right-2 top-2 z-10">
                {value &&
                    isValid !== null &&
                    (isValid ? (
                        <CheckCircle2
                            size={12}
                            className="text-green-500 animate-in zoom-in"
                        />
                    ) : (
                        <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    ))}
            </div>
            <div
                className={`relative flex items-center w-full theme-bubble-bg rounded-2xl border transition-all duration-300 ${value && isValid === false
                    ? "border-red-500/50 bg-red-50/5 dark:bg-red-900/10"
                    : isValid === false && showValidationErrors
                        ? "border-red-500/50 bg-red-50/5 dark:bg-red-900/10"
                        : isFocused
                            ? "border-(--primary-color) glow-primary bg-transparent"
                            : "border-transparent"
                    }`}
            >
                <motion.div
                    animate={{ scale: isFocused ? 1.1 : 1 }}
                    className="pl-4 pr-2 shrink-0 transition-colors"
                    style={{ color: isFocused ? "var(--primary-color)" : "var(--theme-text-secondary)", opacity: isFocused ? 1 : 0.5 }}
                >
                    {icon}
                </motion.div>

                <div className="relative flex-1 px-1 pt-5 pb-2">
                    <label
                        className={`absolute left-1 transition-all duration-300 pointer-events-none font-bold ${isFloated
                            ? "top-1 text-[10px] uppercase tracking-widest text-(--theme-text-secondary) opacity-70"
                            : "top-1/2 -translate-y-1/2 text-(--theme-text-secondary) text-sm"
                            }`}
                        style={isFocused && isValid !== false ? { color: "var(--primary-color)", opacity: 1 } : undefined}
                    >
                        {label} {required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    <input
                        name={name}
                        type={type}
                        value={value}
                        onChange={onChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={isFocused ? placeholder : ""}
                        autoComplete="off"
                        className="w-full bg-transparent outline-none theme-text-main text-sm font-bold placeholder:font-normal placeholder:opacity-40 h-6"
                    />
                </div>
                {showPasswordToggle && onTogglePassword && (
                    <button
                        type="button"
                        onClick={onTogglePassword}
                        className="pr-4 pl-2 theme-text-secondary opacity-40 active:scale-90 transition-transform shrink-0"
                    >
                        {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
};

// ─── AccountTypeToggle ────────────────────────────────────────────────────────
const AccountTypeToggle: React.FC<{
    value: "individual" | "business";
    onChange: (v: "individual" | "business") => void;
}> = ({ value, onChange }) => (
    <div className="theme-bubble-bg rounded-[20px] p-1.5 flex gap-1 border theme-border">
        {(
            [
                {
                    id: "individual",
                    label: "Individuel",
                    icon: <UserRound size={16} />,
                },
                { id: "business", label: "Entreprise", icon: <Building2 size={16} /> },
            ] as const
        ).map((opt) => (
            <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[14px] text-xs font-black transition-all duration-300 ${value === opt.id
                    ? "theme-primary-bg text-white shadow-lg scale-[1.02]"
                    : "theme-text-secondary hover:theme-text-main"
                    }`}
            >
                {opt.icon} {opt.label}
            </button>
        ))}
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
interface SignupProps {
    onSignup: (data: any) => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [accountType, setAccountType] = useState<"individual" | "business">(
        "individual",
    );
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [missingFieldsModal, setMissingFieldsModal] = useState(false);
    const [legalModal, setLegalModal] = useState<"terms" | "privacy" | null>(
        null,
    );
    const [comingSoonModal, setComingSoonModal] = useState(false);

    // ── Individual form ────────────────────────────────────────────────────────
    const [indForm, setIndForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    // ── Business form ──────────────────────────────────────────────────────────
    const [bizForm, setBizForm] = useState({
        companyName: "",
        firstName: "",
        lastName: "",
        sector: "",
        nif: "",
        address: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    // ── Validations ────────────────────────────────────────────────────────────
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const indVal = useMemo(() => {
        const ep = indForm.email.trim().length > 0;
        const pp = indForm.phone.trim().length > 0;
        const phoneDigits = indForm.phone.replace(/\D/g, "");
        return {
            firstName:
                indForm.firstName.trim().length >= 2
                    ? true
                    : indForm.firstName.length > 0
                        ? false
                        : null,
            lastName:
                indForm.lastName.trim().length >= 2
                    ? true
                    : indForm.lastName.length > 0
                        ? false
                        : null,
            email: ep ? emailRegex.test(indForm.email) : null,
            phone: pp ? phoneDigits.length >= 8 : null,
            identityOk:
                (ep && emailRegex.test(indForm.email)) ||
                (pp && phoneDigits.length >= 8),
            password: indForm.password.length >= 6,
            confirmPassword:
                indForm.password === indForm.confirmPassword &&
                indForm.confirmPassword !== "",
        };
    }, [indForm]);

    const bizVal = useMemo(() => {
        const ep = bizForm.email.trim().length > 0;
        const pp = bizForm.phone.trim().length > 0;
        const phoneDigits = bizForm.phone.replace(/\D/g, "");
        return {
            companyName:
                bizForm.companyName.trim().length >= 2
                    ? true
                    : bizForm.companyName.length > 0
                        ? false
                        : null,
            firstName:
                bizForm.firstName.trim().length >= 2
                    ? true
                    : bizForm.firstName.length > 0
                        ? false
                        : null,
            lastName:
                bizForm.lastName.trim().length >= 2
                    ? true
                    : bizForm.lastName.length > 0
                        ? false
                        : null,
            sector:
                bizForm.sector.trim().length >= 2
                    ? true
                    : bizForm.sector.length > 0
                        ? false
                        : null,
            nif:
                bizForm.nif.trim().length >= 4
                    ? true
                    : bizForm.nif.length > 0
                        ? false
                        : null,
            email: ep ? emailRegex.test(bizForm.email) : null,
            phone: pp ? phoneDigits.length >= 8 : null,
            identityOk:
                (ep && emailRegex.test(bizForm.email)) ||
                (pp && phoneDigits.length >= 8),
            password: bizForm.password.length >= 6,
            confirmPassword:
                bizForm.password === bizForm.confirmPassword &&
                bizForm.confirmPassword !== "",
        };
    }, [bizForm]);

    const isFormValid = useMemo(() => {
        if (accountType === "individual") {
            return (
                indVal.firstName === true &&
                indVal.lastName === true &&
                indVal.identityOk &&
                indVal.password &&
                indVal.confirmPassword &&
                agreedToTerms
            );
        }
        return (
            bizVal.companyName === true &&
            bizVal.firstName === true && // ← CORRIGÉ : firstName au lieu de repName
            bizVal.lastName === true &&
            bizVal.sector === true &&
            bizVal.nif === true &&
            bizVal.identityOk &&
            bizVal.password &&
            bizVal.confirmPassword &&
            agreedToTerms
        );
    }, [accountType, indVal, bizVal, agreedToTerms]);

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleIndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "phone") {
            const digits = value.replace(/[^\d+]/g, "");
            if (digits && !digits.startsWith("+509")) {
                setIndForm((p) => ({
                    ...p,
                    phone: digits.startsWith("509") ? "+" + digits : "+509" + digits,
                }));
            } else {
                setIndForm((p) => ({ ...p, phone: digits }));
            }
        } else {
            setIndForm((p) => ({ ...p, [name]: value }));
        }
    };

    const handleBizChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "phone") {
            const digits = value.replace(/[^\d+]/g, "");
            if (digits && !digits.startsWith("+509")) {
                setBizForm((p) => ({
                    ...p,
                    phone: digits.startsWith("509") ? "+" + digits : "+509" + digits,
                }));
            } else {
                setBizForm((p) => ({ ...p, phone: digits }));
            }
        } else {
            setBizForm((p) => ({ ...p, [name]: value }));
        }
    };

    // ── Legal modal ────────────────────────────────────────────────────────────
    const getLegalContent = () => {
        if (!legalModal) return null;
        const currentMonth = [
            "Janvier",
            "Février",
            "Mars",
            "Avril",
            "Mai",
            "Juin",
            "Juillet",
            "Août",
            "Septembre",
            "Octobre",
            "Novembre",
            "Décembre",
        ][new Date().getMonth()];
        if (legalModal === "terms") {
            return {
                title: t("legal_pages.terms.title"),
                icon: <FileText className="theme-primary-text" size={32} />,
                text: `${t("legal_pages.terms.content")}\n\n${t("legal_pages.terms.list")}\n\n${t("legal_pages.terms.last_update", { month: currentMonth })}`,
            };
        }
        return {
            title: t("legal_pages.privacy.title"),
            icon: <Shield className="theme-primary-text" size={32} />,
            text: `${t("legal_pages.privacy.content")}\n\n${t("legal_pages.privacy.persona_note")}`,
        };
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) {
            setShowValidationErrors(true);
            setMissingFieldsModal(true);
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);

        if (accountType === "individual") {
            const firstName = toTitleCase(indForm.firstName);
            const lastName = toTitleCase(indForm.lastName);
            const payload = {
                firstName,
                lastName,
                name: `${firstName} ${lastName}`,
                email: indForm.email ? toLower(indForm.email) : undefined,
                phone: indForm.phone || undefined,
                password: indForm.password,
                accountType: "individual",
                device: navigator.userAgent,
            };
            setTimeout(() => {
                onSignup(payload);
                setIsSubmitting(false);
            }, 800);
        } else {
            const firstName = toTitleCase(bizForm.firstName);
            const lastName = toTitleCase(bizForm.lastName);
            const payload = {
                firstName,
                lastName,
                name: `${firstName} ${lastName}`,
                companyName: toTitleCase(bizForm.companyName),
                sector: toTitleCase(bizForm.sector),
                nif: bizForm.nif.trim().toUpperCase(),
                address: bizForm.address.trim(),
                email: bizForm.email ? toLower(bizForm.email) : undefined,
                phone: bizForm.phone || undefined,
                password: bizForm.password,
                accountType: "business",
                device: navigator.userAgent,
            };
            setTimeout(() => {
                onSignup(payload);
                setIsSubmitting(false);
            }, 800);
        }
    };

    const content = getLegalContent();

    return (
        <PageTransition direction="left" className="min-h-screen theme-card-bg flex flex-col">
            {/* Header */}
            <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 theme-card-bg z-20 shrink-0">
                <motion.button
                    whileHover={{ x: -2, scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate("/login")}
                    disabled={isSubmitting}
                    className="p-2 -ml-2 theme-text-secondary transition-transform disabled:opacity-30"
                >
                    <ArrowLeft size={24} />
                </motion.button>
                <span className="theme-primary-text font-black italic text-xl tracking-tighter">
                    piYès
                </span>
                <div className="flex items-center gap-2">
                    <ThemeSelector />
                    <LanguageSelector />
                </div>
            </header>

            <main className="flex-1 px-8 overflow-y-auto no-scrollbar pb-12">
                {/* Titre */}
                <div className="space-y-2 mb-8">
                    <h1 className="text-3xl font-black theme-text-main tracking-tight">
                        {accountType === "individual"
                            ? t("auth.signup_title")
                            : "Créer un compte Entreprise"}
                    </h1>
                    <p className="theme-text-secondary text-sm font-medium">
                        {accountType === "individual"
                            ? t("auth.signup_subtitle")
                            : "Rejoignez piYès et gérez vos encaissements professionnels."}
                    </p>
                </div>

                {/* Toggle compte */}
                <div className="mb-8">
                    <SegmentedControl
                        options={[
                            {
                                id: "individual",
                                label: "Individuel",
                                icon: <UserRound size={16} />,
                            },
                            {
                                id: "business",
                                label: "Entreprise",
                                icon: <Building2 size={16} />,
                            },
                        ]}
                        value={accountType}
                        onChange={(val) => setAccountType(val as "individual" | "business")}
                        className="mb-8"
                    />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ── INDIVIDUEL ──────────────────────────────────────────────── */}
                    {accountType === "individual" && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <InputField
                                    name="firstName"
                                    label="Prénom"
                                    icon={<User size={18} />}
                                    type="text"
                                    placeholder="Jean"
                                    isValid={indVal.firstName}
                                    value={indForm.firstName}
                                    onChange={handleIndChange}
                                    showValidationErrors={showValidationErrors}
                                    required
                                />
                                <InputField
                                    name="lastName"
                                    label="Nom"
                                    icon={<User size={18} />}
                                    type="text"
                                    placeholder="Dupont"
                                    isValid={indVal.lastName}
                                    value={indForm.lastName}
                                    onChange={handleIndChange}
                                    showValidationErrors={showValidationErrors}
                                    required
                                />
                            </div>
                            <InputField
                                name="email"
                                label={t("auth.signup_email_label")}
                                icon={<Mail size={18} />}
                                type="email"
                                placeholder="jean@exemple.com"
                                isValid={indVal.email}
                                value={indForm.email}
                                onChange={handleIndChange}
                                showValidationErrors={showValidationErrors}
                            />
                            <InputField
                                name="phone"
                                label={t("auth.signup_phone_label")}
                                icon={<Smartphone size={18} />}
                                type="tel"
                                placeholder="+509 XXXX XXXX"
                                isValid={indVal.phone}
                                value={indForm.phone}
                                onChange={handleIndChange}
                                showValidationErrors={showValidationErrors}
                            />
                            {!indVal.identityOk &&
                                (indForm.email.length > 0 || indForm.phone.length > 0) && (
                                    <p className="text-[10px] font-bold text-amber-500 px-1">
                                        Au moins un email ou téléphone valide requis.
                                    </p>
                                )}
                            <InputField
                                name="password"
                                label={t("auth.signup_pass_label")}
                                icon={<Lock size={18} />}
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                isValid={indVal.password}
                                value={indForm.password}
                                onChange={handleIndChange}
                                showPasswordToggle
                                onTogglePassword={() => setShowPassword(!showPassword)}
                                isPasswordVisible={showPassword}
                                showValidationErrors={showValidationErrors}
                                required
                            />
                            <InputField
                                name="confirmPassword"
                                label={t("auth.signup_confirm_pass_label")}
                                icon={<Lock size={18} />}
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                isValid={indVal.confirmPassword}
                                value={indForm.confirmPassword}
                                onChange={handleIndChange}
                                showValidationErrors={showValidationErrors}
                                required
                            />
                        </>
                    )}

                    {/* ── ENTREPRISE ──────────────────────────────────────────────── */}
                    {accountType === "business" && (
                        <>
                            <InputField
                                name="companyName"
                                label="Nom de l'entreprise"
                                icon={<Building2 size={18} />}
                                type="text"
                                placeholder="Entreprise SA"
                                isValid={bizVal.companyName}
                                value={bizForm.companyName}
                                onChange={handleBizChange}
                                showValidationErrors={showValidationErrors}
                                required
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <InputField
                                    name="firstName"
                                    label="Prénom du représentant"
                                    icon={<User size={18} />}
                                    type="text"
                                    placeholder="Jean"
                                    isValid={bizVal.firstName}
                                    value={bizForm.firstName}
                                    onChange={handleBizChange}
                                    showValidationErrors={showValidationErrors}
                                    required
                                />
                                <InputField
                                    name="lastName"
                                    label="Nom du représentant"
                                    icon={<User size={18} />}
                                    type="text"
                                    placeholder="Dupont"
                                    isValid={bizVal.lastName}
                                    value={bizForm.lastName}
                                    onChange={handleBizChange}
                                    showValidationErrors={showValidationErrors}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <InputField
                                    name="sector"
                                    label="Secteur d'activité"
                                    icon={<Briefcase size={18} />}
                                    type="text"
                                    placeholder="Commerce, Tech..."
                                    isValid={bizVal.sector}
                                    value={bizForm.sector}
                                    onChange={handleBizChange}
                                    showValidationErrors={showValidationErrors}
                                    required
                                />
                                <InputField
                                    name="nif"
                                    label="NIF / Matricule"
                                    icon={<CreditCard size={18} />}
                                    type="text"
                                    placeholder="HT-XXXXXXXX"
                                    isValid={bizVal.nif}
                                    value={bizForm.nif}
                                    onChange={handleBizChange}
                                    showValidationErrors={showValidationErrors}
                                    required
                                />
                            </div>
                            <InputField
                                name="address"
                                label="Adresse"
                                icon={<MapPin size={18} />}
                                type="text"
                                placeholder="Pétion-Ville, Port-au-Prince"
                                isValid={null}
                                value={bizForm.address}
                                onChange={handleBizChange}
                                showValidationErrors={showValidationErrors}
                            />
                            <InputField
                                name="email"
                                label="Email professionnel"
                                icon={<Mail size={18} />}
                                type="email"
                                placeholder="contact@entreprise.com"
                                isValid={bizVal.email}
                                value={bizForm.email}
                                onChange={handleBizChange}
                                showValidationErrors={showValidationErrors}
                            />
                            <InputField
                                name="phone"
                                label="Téléphone professionnel"
                                icon={<Smartphone size={18} />}
                                type="tel"
                                placeholder="+509 XXXX XXXX"
                                isValid={bizVal.phone}
                                value={bizForm.phone}
                                onChange={handleBizChange}
                                showValidationErrors={showValidationErrors}
                            />
                            {!bizVal.identityOk &&
                                (bizForm.email.length > 0 || bizForm.phone.length > 0) && (
                                    <p className="text-[10px] font-bold text-amber-500 px-1">
                                        Au moins un email ou téléphone valide requis.
                                    </p>
                                )}
                            <InputField
                                name="password"
                                label={t("auth.signup_pass_label")}
                                icon={<Lock size={18} />}
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                isValid={bizVal.password}
                                value={bizForm.password}
                                onChange={handleBizChange}
                                showPasswordToggle
                                onTogglePassword={() => setShowPassword(!showPassword)}
                                isPasswordVisible={showPassword}
                                showValidationErrors={showValidationErrors}
                                required
                            />
                            <InputField
                                name="confirmPassword"
                                label={t("auth.signup_confirm_pass_label")}
                                icon={<Lock size={18} />}
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                isValid={bizVal.confirmPassword}
                                value={bizForm.confirmPassword}
                                onChange={handleBizChange}
                                showValidationErrors={showValidationErrors}
                                required
                            />
                        </>
                    )}

                    {/* Terms */}
                    <div className="py-4">
                        <label className="flex items-start gap-4 cursor-pointer group">
                            <div className="relative shrink-0 mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div
                                    className={`w-6 h-6 theme-bubble-bg border-2 theme-border rounded-lg transition-all flex items-center justify-center shadow-sm ${agreedToTerms ? "bg-(--primary-color) border-transparent" : "group-hover:border-(--primary-color)"}`}
                                >
                                    {agreedToTerms && (
                                        <CheckCircle2
                                            size={16}
                                            className="text-white"
                                            fill="currentColor"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="text-xs theme-text-secondary leading-relaxed select-none">
                                {t("auth.signup_terms_prefix")}{" "}
                                <span
                                    className="theme-primary-text font-bold underline"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setLegalModal("terms");
                                    }}
                                >
                                    {t("auth.signup_cgu")}
                                </span>{" "}
                                {t("auth.signup_terms_and")}{" "}
                                <span
                                    className="theme-primary-text font-bold underline"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setLegalModal("privacy");
                                    }}
                                >
                                    {t("auth.signup_privacy")}
                                </span>
                            </div>
                        </label>
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        fullWidth
                        rightIcon={!isSubmitting ? <ChevronRight size={20} /> : undefined}
                        className={`mt-4 uppercase tracking-widest ${!isFormValid ? "opacity-60" : ""}`}
                    >
                        {t("auth.signup_btn")}
                    </Button>
                </form>

                {/* Social */}
                <div className="mt-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 theme-border border-t" />
                        <span className="text-[10px] font-black theme-text-secondary uppercase tracking-[0.2em]">
                            {t("auth.signup_social_or")}
                        </span>
                        <div className="h-px flex-1 theme-border border-t" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                        >
                            {t("auth.signup_google")}
                        </Button>
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
                        >
                            {t("auth.signup_apple")}
                        </Button>
                    </div>
                    <Button
                        variant="text"
                        onClick={() => navigate("/login")}
                        disabled={isSubmitting}
                        className="w-full theme-text-secondary"
                    >
                        {t("auth.signup_already_registered")}
                    </Button>
                </div>
            </main>

            <footer className="p-8 flex flex-col items-center gap-2 opacity-30 mt-auto">
                <ShieldCheck size={24} className="theme-text-main" />
                <p className="text-[9px] font-black theme-text-main uppercase tracking-widest">

                </p>
            </footer>

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

            {/* Missing Fields Modal */}
            <Modal
                isOpen={missingFieldsModal}
                onClose={() => setMissingFieldsModal(false)}
                type="centered"
            >
                <div className="p-8 space-y-6 text-center animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <Info size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black theme-text-main">
                            {t("auth.missing_fields_title") || "Champs manquants"}
                        </h3>
                        <p className="text-sm theme-text-secondary">
                            {t("auth.missing_fields_desc") ||
                                "Veuillez remplir tous les champs obligatoires correctement."}
                        </p>
                    </div>
                    <div className="space-y-2 text-left bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/20">
                        {accountType === "individual" ? (
                            <>
                                {indVal.firstName !== true && (
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                        • Prénom (min 2 caractères)
                                    </p>
                                )}
                                {indVal.lastName !== true && (
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                        • Nom (min 2 caractères)
                                    </p>
                                )}
                                {!indVal.identityOk && (
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                        • Email ou téléphone valide requis
                                    </p>
                                )}
                                {!indVal.password && (
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                        • Mot de passe (min 6 caractères)
                                    </p>
                                )}
                                {!indVal.confirmPassword && (
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                        • Confirmation du mot de passe
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                {bizVal.companyName !== true && (
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                        • Nom de l'entreprise requis
                                    </p>
                                )}
                                {bizVal.firstName !== true && (
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                        • Prénom du représentant requis
                                    </p>
                                )}
                                {bizVal.lastName !== true && (
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                        • Nom du représentant requis
                                    </p>
                                )}
                                {bizVal.sector !== true && (
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                        • Secteur d'activité requis
                                    </p>
                                )}
                                {bizVal.nif !== true && (
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                        • NIF / Matricule requis
                                    </p>
                                )}
                                {!bizVal.identityOk && (
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                        • Email ou téléphone valide requis
                                    </p>
                                )}
                                {!bizVal.password && (
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                        • Mot de passe (min 6 caractères)
                                    </p>
                                )}
                                {!bizVal.confirmPassword && (
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                        • Confirmation du mot de passe
                                    </p>
                                )}
                            </>
                        )}
                        {!agreedToTerms && (
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                • Acceptation des conditions requise
                            </p>
                        )}
                    </div>
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={() => setMissingFieldsModal(false)}
                    >
                        {t("common.ok") || "Compris"}
                    </Button>
                </div>
            </Modal>

            {/* Legal Modal */}
            <Modal isOpen={!!legalModal} onClose={() => setLegalModal(null)}>
                {content && (
                    <div className="p-8 space-y-8 animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black theme-text-main tracking-tight">
                                {content.title}
                            </h2>
                            <button
                                onClick={() => setLegalModal(null)}
                                className="p-2 theme-bubble-bg rounded-full theme-text-secondary active:scale-90"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex justify-center py-4">
                            <div className="w-20 h-20 theme-bubble-bg rounded-4xl flex items-center justify-center shadow-inner border theme-border">
                                {content.icon}
                            </div>
                        </div>
                        <div className="theme-text-secondary text-sm leading-relaxed whitespace-pre-wrap max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                            {content.text}
                            {"\n\n"}piYès s'engage à maintenir la confidentialité et la
                            sécurité de vos informations personnelles conformément aux lois en
                            vigueur.
                        </div>
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => setLegalModal(null)}
                            className="mt-6"
                        >
                            {t("common.close")}
                        </Button>
                    </div>
                )}
            </Modal>
        </PageTransition>
    );
};

export default Signup;