// pages/KeysSettings.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
    ArrowLeft,
    Plus,
    Key as KeyIcon,
    Trash2,
    X,
    Check,
    RefreshCw,
    Loader2,
    Shield,
    Copy,
} from "lucide-react";
import { api } from "../services/apiService";
import { Key } from "../shared/types";
import { useToast, useTranslation } from "../App";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import SegmentedControl from "../components/SegmentedControl";
import { cacheService } from "../services/cacheService";

type KeyType = "email" | "phone" | "tag" | "random";

const KeysSettings: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [keys, setKeys] = useState<Key[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showNewModal, setShowNewModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
    const [showAlreadyExistsModal, setShowAlreadyExistsModal] = useState(false);
    const [alreadyExistsMessage, setAlreadyExistsMessage] = useState("");

    const [newKeyType, setNewKeyType] = useState<KeyType>("email");
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Swipe between tabs
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const keyTypes: KeyType[] = ["email", "phone", "tag", "random"];

    // Isolated states for each tab
    const [emailValue, setEmailValue] = useState("");
    const [phoneValue, setPhoneValue] = useState("");
    const [tagValue, setTagValue] = useState("");
    const [randomValue, setRandomValue] = useState("");

    const [isCheckingTag, setIsCheckingTag] = useState(false);
    const [isTagAvailable, setIsTagAvailable] = useState<boolean | null>(null);
    const [tagError, setTagError] = useState<string | null>(null);

    const [verifyingKey, setVerifyingKey] = useState<Key | null>(null);
    const [otpCode, setOtpCode] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    // Swipe handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartX) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const currentIndex = keyTypes.indexOf(newKeyType);

        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0 && currentIndex > 0) {
                setNewKeyType(keyTypes[currentIndex - 1]);
            } else if (deltaX < 0 && currentIndex < keyTypes.length - 1) {
                setNewKeyType(keyTypes[currentIndex + 1]);
            }
        }
        setTouchStartX(null);
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async (forceRefresh = false) => {
        setLoading(true);

        if (!forceRefresh) {
            const cached = cacheService.get("keys");
            if (cached) {
                setKeys(cached);
                setLoading(false);
                return;
            }
        }

        try {
            if (forceRefresh) {
                await api.syncFresh();
            }
            const data = await api.getKeys();
            setKeys(data);
            cacheService.set("keys", data, 1000 * 60 * 30);
        } catch (e) {
            const stale = cacheService.get("keys");
            if (stale) setKeys(stale);
        }
        setLoading(false);
    };

    const handleDeleteClick = (id: string) => {
        setKeyToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!keyToDelete) return;
        setLoading(true);
        try {
            await api.deleteKey(keyToDelete);
            const updatedKeys = keys.filter((k) => k.id !== keyToDelete);
            setKeys(updatedKeys);
            cacheService.set("keys", updatedKeys, 1000 * 60 * 30);
            setShowDeleteConfirm(false);
            setKeyToDelete(null);
        } catch (e) {
            alert(t("common.error"));
        }
        setLoading(false);
    };

    // Tag validation
    useEffect(() => {
        const checkTag = async () => {
            if (tagValue.length >= 4) {
                setIsCheckingTag(true);
                setTagError(null);
                try {
                    const available = await api.checkTagAvailability(tagValue);
                    setIsTagAvailable(available);
                    if (!available) setTagError("Ce tag est déjà pris");
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsCheckingTag(false);
                }
            } else {
                setIsTagAvailable(null);
                setTagError(null);
            }
        };

        if (newKeyType === "tag") {
            const timer = setTimeout(checkTag, 500);
            return () => clearTimeout(timer);
        }
    }, [tagValue, newKeyType]);

    // Random key generation
    const generateRandomKey = () => {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < 25; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setRandomValue(result);
        setIsRegenerating(true);
        setTimeout(() => setIsRegenerating(false), 300);
    };

    // Auto-generate random key when tab opens
    useEffect(() => {
        if (newKeyType === "random") {
            if (!randomValue) {
                generateRandomKey();
            }
            const interval = setInterval(() => {
                generateRandomKey();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [newKeyType]);

    const handleCopyKey = async (keyValue: string, keyId: string) => {
        if (!keyValue) return;
        try {
            await navigator.clipboard.writeText(keyValue);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = keyValue;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        setCopiedKeyId(keyId);
        showToast(t("common.copied"), "success");
        setTimeout(() => setCopiedKeyId(null), 2000);
    };

    const handleCreateKey = async () => {
        let value = "";
        if (newKeyType === "email") value = emailValue;
        else if (newKeyType === "phone") value = `+509${phoneValue}`;
        else if (newKeyType === "tag") value = tagValue.startsWith("@") ? tagValue : `@${tagValue}`;
        else if (newKeyType === "random") value = randomValue;

        if (!value) return;

        setLoading(true);
        try {
            const k = await api.createKey(newKeyType, value);
            if (k.isVerified) {
                setKeys([...keys, k]);
                cacheService.set("keys", [...keys, k], 1000 * 60 * 30);
                setShowNewModal(false);
                resetNewKeyStates();
            } else {
                setKeys([...keys, k]);
                cacheService.set("keys", [...keys, k], 1000 * 60 * 30);
                setVerifyingKey(k);
                setShowNewModal(false);
                resetNewKeyStates();
            }
        } catch (e: any) {
            if (e?.code === "PRIMARY_KEY_EXISTS") {
                setAlreadyExistsMessage(
                    t("pix.already_primary") || "Cette clé fait déjà partie de vos clés principales."
                );
                setShowAlreadyExistsModal(true);
            } else if (e?.message?.includes("Key already in use")) {
                setAlreadyExistsMessage(
                    t("pix.already_secondary") || "Cette clé existe déjà dans vos clés secondaires."
                );
                setShowAlreadyExistsModal(true);
            } else {
                alert(t("common.error"));
            }
        }
        setLoading(false);
    };

    const resetNewKeyStates = () => {
        setEmailValue("");
        setPhoneValue("");
        setTagValue("");
        setRandomValue("");
        setIsTagAvailable(null);
        setTagError(null);
    };

    const handleVerifyKey = async () => {
        if (!verifyingKey || !otpCode) return;
        setIsVerifying(true);
        try {
            const success = await api.verifySecondaryKey(verifyingKey.id, otpCode);
            if (success) {
                setKeys(prevKeys => {
                    const updated = prevKeys.map((k) =>
                        k.id === verifyingKey.id ? { ...k, isVerified: true } : k
                    );
                    cacheService.set("keys", updated, 1000 * 60 * 30);
                    return updated;
                });
                setVerifyingKey(null);
                setOtpCode("");
                showToast(t("pix.verify_modal.success"), "success");
            } else {
                showToast(t("otp.error_invalid"), "error");
            }
        } catch (e) {
            showToast(t("common.error"), "error");
        }
        setIsVerifying(false);
    };

    return (
        <div className="theme-card-bg min-h-screen pb-32">
            <PageHeader
                title={t("settings.items.keys.label") || "Mes clés"}
                onBack={() => navigate(-1)}
            />

            <div className="p-6 space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center border-b theme-border pb-4">
                    <h2 className="text-sm font-bold theme-text-secondary uppercase tracking-widest">
                        {t("pix.keys_section") || "Mes identifiants"}
                    </h2>
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="theme-primary-text font-bold text-xs flex items-center gap-1"
                    >
                        <Plus size={14} /> {t("pix.add_key") || "Ajouter"}
                    </button>
                </div>

                <div className="space-y-2">
                    {keys.map((k) => (
                        <div
                            key={k.id}
                            className="flex items-center justify-between py-4 px-2 -mx-2 group border-b theme-border last:border-b-0"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 theme-bubble-bg rounded-full flex items-center justify-center theme-primary-text relative">
                                    <KeyIcon size={18} />
                                    {k.isVerified && (k.type === "email" || k.type === "phone") && (
                                        <div className="absolute -top-1 -right-1 bg-green-500 text-white p-0.5 rounded-full border-2 theme-card-bg">
                                            <Check size={8} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs theme-text-secondary capitalize">
                                            {k.type}
                                        </p>
                                        {!k.isVerified && (
                                            <button
                                                onClick={() => setVerifyingKey(k)}
                                                className="text-[8px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full"
                                            >
                                                {t("pix.key_not_verified") || "À vérifier"}
                                            </button>
                                        )}
                                    </div>
                                    <p className="font-bold theme-text-main text-sm tracking-wider">
                                        {k.type === "phone"
                                            ? (() => {
                                                const digits = k.value.replace("+509", "").replace(/\D/g, "");
                                                if (digits.length <= 4) return `+509 ${digits}`;
                                                return `+509 ${digits.slice(0, 4)} ${digits.slice(4)}`;
                                            })()
                                            : k.value}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleCopyKey(k.value, k.id)}
                                    className="p-2 theme-text-secondary hover:theme-primary-text active:scale-90 transition-all"
                                    aria-label={t("common.copy")}
                                >
                                    {copiedKeyId === k.id ? (
                                        <Check size={18} className="text-green-500" />
                                    ) : (
                                        <Copy size={18} />
                                    )}
                                </button>
                                <button
                                    onClick={() => !k.isPrimary && handleDeleteClick(k.id)}
                                    onMouseDown={(e) => e.currentTarget.classList.add('text-red-500')}
                                    onMouseUp={(e) => e.currentTarget.classList.remove('text-red-500')}
                                    onMouseLeave={(e) => e.currentTarget.classList.remove('text-red-500')}
                                    className={`p-2 transition-all active:scale-90 ${k.isPrimary
                                            ? "theme-text-secondary opacity-20 cursor-not-allowed"
                                            : "theme-text-secondary hover:text-red-500"
                                        }`}
                                    disabled={k.isPrimary}
                                    aria-label={t("common.delete")}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {keys.length === 0 && !loading && (
                        <p className="text-center py-10 theme-text-secondary text-sm italic opacity-40">
                            {t("pix.no_keys") || "Aucune clé enregistrée"}
                        </p>
                    )}
                    {loading && (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin theme-primary-text" size={24} />
                        </div>
                    )}
                </div>
            </div>

            {/* NEW KEY MODAL */}
            <Modal
                isOpen={showNewModal}
                onClose={() => {
                    setShowNewModal(false);
                    resetNewKeyStates();
                }}
            >
                <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold theme-text-main">
                            {t("pix.modal.title") || "Ajouter une clé"}
                        </h3>
                        <button
                            onClick={() => {
                                setShowNewModal(false);
                                resetNewKeyStates();
                            }}
                            className="p-2 theme-bubble-bg rounded-full theme-text-secondary"
                        >
                            <X />
                        </button>
                    </div>
                    <div className="space-y-6">
                        <SegmentedControl
                            options={[
                                { id: "email", label: t("pix.types.email") || "Email" },
                                { id: "phone", label: t("pix.types.phone") || "Téléphone" },
                                { id: "tag", label: t("pix.types.tag") || "Tag" },
                                { id: "random", label: t("pix.types.random") || "Aléatoire" },
                            ]}
                            value={newKeyType}
                            onChange={(val) => setNewKeyType(val as KeyType)}
                            className="rounded-2xl"
                        />

                        <div
                            className="space-y-4"
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >
                            {newKeyType === "email" && (
                                <div className="space-y-2 animate-in slide-in-from-right duration-200">
                                    <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                                        {t("pix.labels.email") || "Adresse email"}
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="email@exemple.com"
                                        value={emailValue}
                                        onChange={(e) => setEmailValue(e.target.value)}
                                        className="w-full theme-bubble-bg p-4 rounded-2xl outline-none theme-text-main border theme-border focus:border-(--primary-color) transition-all font-bold"
                                    />
                                </div>
                            )}

                            {newKeyType === "phone" && (
                                <div className="space-y-2 animate-in slide-in-from-right duration-200">
                                    <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                                        {t("pix.labels.phone") || "Numéro de téléphone"}
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-4 font-bold theme-text-secondary text-sm">
                                            +509&nbsp;
                                        </span>
                                        <input
                                            type="tel"
                                            placeholder="xxxx xxxx"
                                            maxLength={9}
                                            value={(() => {
                                                const digits = phoneValue.replace(/\D/g, "");
                                                if (digits.length <= 4) return digits;
                                                return `${digits.slice(0, 4)} ${digits.slice(4)}`;
                                            })()}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/[\s\D]/g, "");
                                                setPhoneValue(raw);
                                            }}
                                            className="w-full theme-bubble-bg p-4 pl-17 rounded-2xl outline-none theme-text-main border theme-border focus:border-(--primary-color) transition-all font-bold tracking-wider"
                                        />
                                    </div>
                                </div>
                            )}

                            {newKeyType === "tag" && (
                                <div className="space-y-2 animate-in slide-in-from-right duration-200">
                                    <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                                        {t("pix.labels.tag") || "Tag utilisateur"}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold theme-text-secondary">
                                            @
                                        </span>
                                        <input
                                            type="text"
                                            placeholder={t("pix.labels.tag_placeholder") || "utilisateur"}
                                            value={tagValue}
                                            onChange={(e) =>
                                                setTagValue(
                                                    e.target.value
                                                        .toLowerCase()
                                                        .replace(/[^a-z0-9_]/g, ""),
                                                )
                                            }
                                            className={`w-full theme-bubble-bg p-4 pl-8 rounded-2xl outline-none theme-text-main border transition-all font-bold ${tagError ? "border-red-500" : "theme-border focus:border-(--primary-color)"
                                                }`}
                                        />
                                        {isCheckingTag && (
                                            <Loader2
                                                className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin theme-primary-text"
                                                size={16}
                                            />
                                        )}
                                        {isTagAvailable === true && !isCheckingTag && (
                                            <Check
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
                                                size={16}
                                            />
                                        )}
                                    </div>
                                    {tagError && (
                                        <p className="text-[10px] text-red-500 font-bold px-1">
                                            {tagError}
                                        </p>
                                    )}
                                    <p className="text-[9px] theme-text-secondary px-1 italic">
                                        {t("pix.labels.tag_hint") || "4 caractères minimum, lettres, chiffres et _"}
                                    </p>
                                </div>
                            )}

                            {newKeyType === "random" && (
                                <div className="space-y-4 animate-in slide-in-from-right duration-200">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                                            {t("pix.labels.random") || "Clé aléatoire"}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                readOnly
                                                value={randomValue}
                                                className="w-full theme-bubble-bg p-4 pr-12 rounded-2xl outline-none theme-text-main border theme-border font-mono text-xs font-bold"
                                            />
                                            <button
                                                onClick={generateRandomKey}
                                                disabled={isRegenerating}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 theme-text-secondary hover:theme-primary-text active:scale-90 transition-all p-1 disabled:opacity-50"
                                                aria-label={t("pix.labels.regenerate") || "Régénérer"}
                                            >
                                                <RefreshCw
                                                    size={18}
                                                    className={isRegenerating ? "animate-spin" : ""}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] theme-text-secondary px-1 italic">
                                            {t("pix.labels.random_hint") || "Sert pour les transactions anonymes"}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleCreateKey}
                            disabled={
                                loading ||
                                (newKeyType === "email" && !emailValue.includes("@")) ||
                                (newKeyType === "phone" && phoneValue.length < 8) ||
                                (newKeyType === "tag" && (tagValue.length < 4 || !isTagAvailable)) ||
                                (newKeyType === "random" && !randomValue)
                            }
                            className="w-full theme-primary-bg text-white py-5 rounded-3xl font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin mx-auto" size={20} />
                            ) : (
                                t("pix.modal.btn_confirm") || "Ajouter"
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* VERIFY KEY MODAL */}
            <Modal
                isOpen={!!verifyingKey}
                onClose={() => setVerifyingKey(null)}
                type="centered"
            >
                <div className="p-8 space-y-8 text-center">
                    <div className="w-16 h-16 theme-bubble-bg rounded-3xl flex items-center justify-center mx-auto theme-primary-text shadow-inner">
                        <Shield size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black theme-text-main tracking-tight">
                            {t("pix.verify_modal.title") || "Vérification requise"}
                        </h3>
                        <p className="text-xs theme-text-secondary leading-relaxed">
                            {t("pix.verify_modal.sub", {
                                channel: verifyingKey?.type === "email" ? "e-mail" : "SMS",
                            }) || "Un code a été envoyé par " + (verifyingKey?.type === "email" ? "e-mail" : "SMS")}
                        </p>
                    </div>
                    <div className="space-y-6">
                        <input
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-gray-50 dark:bg-white/5 p-5 rounded-2xl text-center text-3xl font-black tracking-[0.5em] theme-text-main outline-none border-2 border-transparent focus:border-(--primary-color) transition-all"
                        />
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleVerifyKey}
                                disabled={isVerifying || otpCode.length < 6}
                                className="w-full py-5 theme-primary-bg text-white rounded-3xl font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
                            >
                                {isVerifying ? (
                                    <Loader2 className="animate-spin mx-auto" size={20} />
                                ) : (
                                    t("pix.verify_modal.btn_verify") || "Vérifier"
                                )}
                            </button>
                            <button
                                onClick={() => setVerifyingKey(null)}
                                className="w-full py-3 theme-text-secondary font-bold text-xs"
                            >
                                {t("common.cancel") || "Annuler"}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* DELETE CONFIRMATION MODAL */}
            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                type="centered"
            >
                <div className="p-8 space-y-6 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                        <Trash2 size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black theme-text-main tracking-tight">
                            {t("pix.delete_modal.title") || "Supprimer la clé ?"}
                        </h3>
                        <p className="text-sm theme-text-secondary">
                            {t("pix.delete_modal.sub") || "Cette action est irréversible."}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={confirmDelete}
                            disabled={loading}
                            className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <Trash2 size={18} />
                            )}
                            {t("pix.delete_modal.btn_delete") || "Supprimer"}
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="w-full py-4 theme-bubble-bg theme-text-main rounded-2xl font-bold active:scale-95 transition-all"
                        >
                            {t("common.cancel") || "Annuler"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ALREADY EXISTS MODAL */}
            <Modal
                isOpen={showAlreadyExistsModal}
                onClose={() => setShowAlreadyExistsModal(false)}
                type="centered"
            >
                <div className="p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/10 text-amber-500 rounded-3xl flex items-center justify-center mx-auto">
                        <Shield size={32} />
                    </div>
                    <p className="text-lg font-bold theme-text-main">{alreadyExistsMessage}</p>
                    <button
                        onClick={() => setShowAlreadyExistsModal(false)}
                        className="w-full py-4 theme-primary-bg text-white rounded-2xl font-bold"
                    >
                        J'ai compris
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default KeysSettings;