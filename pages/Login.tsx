// pages/Login.tsx

import React, { useState } from "react";
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
  const navigate = useNavigate();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (step === 1) {
      if (validateIdentifier(identifier)) {
        setError("");
        setStep(2);
      } else {
        // Message plus précis selon le type d'identifiant saisi
        const hasAt = identifier.includes("@");
        setError(
          hasAt
            ? "Adresse email invalide. Vérifiez le format (ex: nom@domaine.com)."
            : "Numéro de téléphone invalide. Format attendu : 8 chiffres haïtiens.",
        );
      }
    } else if (step === 2 && password.length >= 6) {
      setIsSubmitting(true);
      const normalized = normalizeIdentifier(identifier);
      const isEmail = identifier.includes("@");
      onLogin({
        [isEmail ? "email" : "phone"]: normalized,
        password,
        device: navigator.userAgent,
      });
      // Note: setIsSubmitting(false) handled by parent on failure
      setTimeout(() => setIsSubmitting(false), 5000);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password", { state: { identifier } });
  };

  return (
    <div className="min-h-screen theme-card-bg flex flex-col px-8 pt-12 animate-in fade-in duration-500">
      {/* Top bar */}
      <div className="mb-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {step === 2 && (
            <button
              onClick={() => {
                setStep(1);
                setPassword("");
                setError("");
              }}
              className="theme-text-main p-2 hover:bg-black/5 rounded-full transition-colors active:scale-90"
            >
              <ArrowLeft size={24} />
            </button>
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
            Gérez vos finances,
            <br />
            <span className="theme-primary-text">Simplement</span> et en toute
            sécurité.
          </h2>
          <p className="text-sm theme-text-secondary font-medium">
            Transférez de l'argent, gratuitement.
          </p>
        </div>
      )}

      <div className="flex-1">
        <h3 className="text-xl font-black theme-text-main mb-6 animate-in slide-in-from-left duration-300 tracking-tight">
          {step === 1 ? t("auth.login_greeting") : t("auth.password_prompt")}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 ? (
            <div className="space-y-2">
              <div className={`flex items-center theme-bubble-bg p-4 rounded-2xl border transition-all duration-300 ${error ? "border-red-500/50 bg-red-50/5 dark:bg-red-900/10" : "border-transparent focus-within:border-(--primary-color) focus-within:bg-transparent"}`}>
                <input
                  autoFocus
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Email ou téléphone"
                  className="w-full text-lg outline-none bg-transparent theme-text-main font-bold placeholder:font-normal placeholder:opacity-40"
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest px-2">
                  {error}
                </p>
              )}
            </div>
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
                <div className="flex items-center theme-bubble-bg p-4 rounded-2xl border transition-all duration-300 border-transparent focus-within:border-(--primary-color) focus-within:bg-transparent">
                  <input
                    autoFocus
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.password_placeholder")}
                    className="w-full text-lg outline-none bg-transparent theme-text-main font-bold placeholder:font-normal placeholder:opacity-40"
                    required
                  />
                </div>
                <p className="text-[10px] theme-text-secondary font-bold uppercase tracking-widest px-2">
                  {t("auth.signup_pass_hint")}
                </p>
              </div>
              <Button
                type="button"
                variant="text"
                size="sm"
                onClick={handleForgotPassword}
                className="uppercase tracking-widest"
              >
                {t("auth.forgot_password")}
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between text-xs theme-text-secondary font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-green-500" />
              {t("auth.secure_access")}
            </span>
          </div>
        </form>

        {/* Social login — only on step 1 */}
        {step === 1 && (
          <div className="mt-8 space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 theme-border border-t" />
              <span className="text-[10px] font-black theme-text-secondary uppercase tracking-[0.2em]">
                ou se connecter avec
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
                Google
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
                Apple
              </Button>
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
        <Button
          variant="text"
          onClick={() => navigate("/signup")}
          className="theme-text-secondary"
        >
          {t("auth.no_account")}
        </Button>
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
    </div>
  );
};

export default Login;
