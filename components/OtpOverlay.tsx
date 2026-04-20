// components/OtpOverlay.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  Smartphone,
  ChevronRight,
  RefreshCw,
  X,
  Loader2,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { useTranslation } from "../App";
import { api } from "../services/apiService";

interface OtpOverlayProps {
  requestId: string;
  onSuccess: (data?: any) => void;
  onCancel?: () => void;
  channel?: "sms" | "email";
  contact?: string;
  mode?: "verify" | "login";
}

const OtpOverlay: React.FC<OtpOverlayProps> = ({
  requestId,
  onSuccess,
  onCancel,
  channel = "email",
  contact,
  mode = "verify",
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Déclencher la demande d'OTP dès le montage du composant
  useEffect(() => {
    if (mode === "verify") {
      const target = contact || requestId;
      api.requestOtp(target, (channel || "email") as "sms" | "email");
    }

    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, [mode, contact, requestId, channel]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError(null);

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if full
    if (newCode.every((c) => c !== "") && newCode.length === 6) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode: string) => {
    setLoading(true);
    try {
      if (mode === "login") {
        // verify-session-otp retourne { user, token }
        // On passe l'objet entier au parent (App.tsx) pour qu'il sauvegarde aussi le token
        const res = await api.verifySessionOtp(requestId, fullCode);
        onSuccess(res); // passer { user, token } complet, pas seulement res.user
      } else {
        const isValid = await api.verifyOtp(requestId, fullCode);
        if (isValid) {
          onSuccess(fullCode);
        } else {
          setError(t("otp.error_invalid"));
          setCode(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      }
    } catch (e) {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    // Vider les champs OTP avant de renvoyer
    setCode(["", "", "", "", "", ""]);
    setError(null);
    await api.resendOtp(requestId);
    setTimer(30);
    // Refocus sur le premier champ
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
    setLoading(false);
  };

  return (
    <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md z-210 theme-card-bg flex flex-col items-center p-8 animate-in fade-in duration-300 shadow-2xl border-x theme-border">
      {onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-12 left-6 p-2 theme-bubble-bg rounded-full theme-text-secondary active:scale-90 transition-transform"
        >
          <X size={24} />
        </button>
      )}

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xs space-y-10">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 theme-bubble-bg rounded-3xl flex items-center justify-center mx-auto shadow-sm theme-primary-text">
            {channel === "email" ? (
              <Mail size={32} />
            ) : (
              <Smartphone size={32} />
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black theme-text-main tracking-tight">
              {t("otp.title")}
            </h2>
            <p className="text-xs theme-text-secondary leading-relaxed">
              {t("otp.subtitle")}
            </p>
            <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">
                Tapez : 0 0 0 0 0 0
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="tel"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-10 h-14 text-center text-xl font-black rounded-xl border-2 transition-all outline-none ${digit ? "theme-primary-bg text-white border-transparent" : "theme-bubble-bg theme-text-main theme-border focus:border-(--primary-color)"}`}
              disabled={loading}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <div className="w-full min-h-10">
          {error && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <p className="text-[10px] font-bold text-red-500 text-center">
                {error}
              </p>
              <div className="p-4 theme-bubble-bg rounded-3xl border theme-border space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <HelpCircle size={14} className="theme-primary-text" />
                  <p className="text-[11px] font-black theme-text-main">
                    {t("otp.trouble")}
                  </p>
                </div>
                <p className="text-[10px] theme-text-secondary leading-relaxed font-medium">
                  {t("otp.contact_info")}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="w-full space-y-4">
          <button
            onClick={handleResend}
            disabled={timer > 0 || loading}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold theme-text-secondary disabled:opacity-40"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            {timer > 0
              ? t("otp.resend_in", { seconds: timer })
              : t("otp.resend")}
          </button>
        </div>
      </div>

      <div className="pb-12 opacity-20 flex flex-col items-center gap-1">
        <ShieldCheck size={20} />
        <span className="text-[8px] font-bold uppercase tracking-widest">
          {t("otp.secure_connection")}
        </span>
      </div>
    </div>
  );
};

export default OtpOverlay;
