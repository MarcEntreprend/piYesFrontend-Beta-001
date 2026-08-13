// src/pages/auth/Otp.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/i18n/LanguageContext";
import type { SignupPayload } from "@/types/auth";

interface OtpState {
  purpose: "login-mfa" | "signup-verify";
  requestId: string;
  contact: string;
  payload?: SignupPayload;
}

export default function Otp() {
  const t = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { verifyLoginOtp, verifySignupOtp, resendOtp } = useAuth();

  const state = location.state as OtpState | null;
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!state) navigate("/auth/login", { replace: true });
  }, [state, navigate]);

  useEffect(() => {
    if (countdown === 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  if (!state) return null;

  const isSignup = state.purpose === "signup-verify";
  const title = isSignup ? t.otp.signupTitle : t.otp.loginTitle;
  const subtitle = isSignup ? t.otp.signupSubtitle : t.otp.loginSubtitle;

  const handleVerify = async () => {
    setError(false);
    setLoading(true);
    try {
      if (isSignup && state.payload) {
        await verifySignupOtp(state.payload, code);
      } else {
        await verifyLoginOtp(state.requestId, code);
      }
      navigate("/", { replace: true });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    await resendOtp();
    setCountdown(60);
    showToast("Code renvoyé", "success");
  };

  return (
    <AuthLayout title={title} subtitle={`${subtitle} ${state.contact}`}>
      <div className="space-y-6">
        <OtpInput value={code} onChange={setCode} error={error} />

        {error && <p className="text-center text-sm font-medium text-[var(--color-danger)]">{t.auth.errors.invalidCode}</p>}

        <p className="text-center text-xs text-[var(--color-text-tertiary)]">{t.otp.demoHint}</p>

        <Button fullWidth size="lg" loading={loading} disabled={code.length < 6} onClick={handleVerify}>
          {t.otp.verify}
        </Button>

        <button
          onClick={handleResend}
          disabled={countdown > 0}
          className="w-full text-center text-sm font-semibold text-[var(--color-brand)] disabled:text-[var(--color-text-tertiary)]"
        >
          {countdown > 0 ? `${t.otp.resend} (${countdown}s)` : t.otp.resend}
        </button>
      </div>
    </AuthLayout>
  );
}