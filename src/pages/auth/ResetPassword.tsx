// src/pages/auth/ResetPassword.tsx
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { OtpInput } from "@/components/ui/OtpInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/i18n/LanguageContext";

export default function ResetPassword() {
  const t = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { resetPassword } = useAuth();

  const email = (location.state as { email?: string } | null)?.email ?? "";
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(t.auth.errors.passwordMismatch);
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, code, password);
      showToast("Mot de passe réinitialisé", "success");
      navigate("/auth/login", { replace: true });
    } catch {
      setError(t.auth.errors.invalidCode);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t.auth.resetTitle} subtitle={`${t.auth.resetSubtitle} — ${email}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <OtpInput value={code} onChange={setCode} error={!!error} />
        <PasswordInput label={t.auth.newPassword} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <PasswordInput label={t.auth.confirmPassword} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

        {error && (
          <p className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-4 py-2.5 text-sm font-medium text-[var(--color-danger)]">{error}</p>
        )}

        <p className="text-center text-xs text-[var(--color-text-tertiary)]">{t.otp.demoHint}</p>

        <Button type="submit" fullWidth size="lg" loading={loading} disabled={code.length < 6}>
          {t.auth.resetButton}
        </Button>
      </form>
    </AuthLayout>
  );
}