// src/pages/auth/Login.tsx
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Envelope, ArrowRight } from "@phosphor-icons/react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/i18n/LanguageContext";

export default function Login() {
    const t = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const { requestId } = await login(identifier, password);
            navigate("/auth/otp", { state: { purpose: "login-mfa", requestId, contact: identifier } });
        } catch {
            setError(t.auth.errors.invalidCredentials);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label={t.auth.identifierLabel}
                    placeholder={t.auth.identifierPlaceholder}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    leadingIcon={<Envelope size={18} weight="light" />}
                    autoComplete="username"
                    required
                />
                <PasswordInput label={t.auth.passwordLabel} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />

                {error && (
                    <p className="rounded-md bg-(--color-danger-soft) px-4 py-2.5 text-sm font-medium text-(--color-danger)">{error}</p>
                )}

                <div className="flex justify-end">
                    <Link to="/auth/forgot-password" className="text-sm font-semibold text-(--color-brand)">
                        {t.auth.forgotPassword}
                    </Link>
                </div>

                <Button type="submit" fullWidth size="lg" loading={loading} trailingIcon={<ArrowRight size={14} weight="bold" />}>
                    {t.auth.loginButton}
                </Button>

                <p className="rounded-md border border-dashed border-(--color-border-strong) px-4 py-2.5 text-center text-xs text-(--color-text-tertiary)">
                    Démo : jb.michel@example.com / piyes2026
                </p>
            </form>

            <p className="mt-8 text-center text-sm text-(--color-text-secondary)">
                {t.auth.noAccount}{" "}
                <Link to="/auth/signup" className="font-semibold text-(--color-brand)">
                    {t.auth.createAccount}
                </Link>
            </p>
        </AuthLayout>
    );
}