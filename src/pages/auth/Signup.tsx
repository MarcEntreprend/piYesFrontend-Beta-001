// src/pages/auth/Signup.tsx

import { useState, type FormEvent, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Envelope, Phone, Buildings, ArrowRight } from "@phosphor-icons/react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/i18n/LanguageContext";
import type { SignupPayload } from "@/types/auth";

export default function Signup() {
  const t = useTranslation();
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accountType: "individual" as "individual" | "business",
    companyName: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError(t.auth.errors.passwordMismatch);
      return;
    }
    if (!acceptedTerms) {
      setError(t.auth.errors.termsRequired);
      return;
    }

    setLoading(true);
    const payload: SignupPayload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
      accountType: form.accountType,
      companyName: form.accountType === "business" ? form.companyName : undefined,
    };
    try {
      const { requestId } = await signup(payload);
      navigate("/auth/otp", { state: { purpose: "signup-verify", requestId, contact: form.email, payload } });
    } catch {
      setError(t.auth.errors.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t.auth.signupTitle} subtitle={t.auth.signupSubtitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SegmentedControl
          options={[
            { value: "individual", label: t.auth.accountTypeIndividual },
            { value: "business", label: t.auth.accountTypeBusiness },
          ]}
          value={form.accountType}
          onChange={(v) => setForm((prev) => ({ ...prev, accountType: v as "individual" | "business" }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label={t.auth.firstName} value={form.firstName} onChange={update("firstName")} leadingIcon={<User size={18} weight="light" />} required />
          <Input label={t.auth.lastName} value={form.lastName} onChange={update("lastName")} required />
        </div>

        {form.accountType === "business" && (
          <Input label={t.auth.companyName} value={form.companyName} onChange={update("companyName")} leadingIcon={<Buildings size={18} weight="light" />} required />
        )}

        <Input label={t.auth.email} type="email" value={form.email} onChange={update("email")} leadingIcon={<Envelope size={18} weight="light" />} required />
        <Input label={t.auth.phoneOptional} type="tel" value={form.phone} onChange={update("phone")} leadingIcon={<Phone size={18} weight="light" />} />
        <PasswordInput label={t.auth.password} value={form.password} onChange={update("password")} required />
        <PasswordInput label={t.auth.confirmPassword} value={form.confirmPassword} onChange={update("confirmPassword")} required />

        {error && (
          <p className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-4 py-2.5 text-sm font-medium text-[var(--color-danger)]">{error}</p>
        )}

        <label className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-[var(--color-brand)]"
          />
          <span>
            {t.auth.termsPrefix} <span className="font-semibold text-[var(--color-brand)]">{t.auth.termsLink}</span>
          </span>
        </label>

        <Button type="submit" fullWidth size="lg" loading={loading} trailingIcon={<ArrowRight size={14} weight="bold" />}>
          {t.auth.signupButton}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">
        {t.auth.haveAccount}{" "}
        <Link to="/auth/login" className="font-semibold text-[var(--color-brand)]">
          {t.auth.login}
        </Link>
      </p>
    </AuthLayout>
  );
}