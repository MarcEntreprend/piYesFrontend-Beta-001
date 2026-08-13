// src/pages/auth/ForgotPassword.tsx
import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Envelope, ArrowRight } from "@phosphor-icons/react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/i18n/LanguageContext";

export default function ForgotPassword() {
  const t = useTranslation();
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await forgotPassword(email);
    setLoading(false);
    navigate("/auth/reset-password", { state: { email } });
  };

  return (
    <AuthLayout title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t.auth.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} leadingIcon={<Envelope size={18} weight="light" />} required />
        <Button type="submit" fullWidth size="lg" loading={loading} trailingIcon={<ArrowRight size={14} weight="bold" />}>
          {t.auth.sendCode}
        </Button>
        <Link to="/auth/login" className="block text-center text-sm font-semibold text-(--color-brand)">
          {t.auth.backToLogin}
        </Link>
      </form>
    </AuthLayout>
  );
}