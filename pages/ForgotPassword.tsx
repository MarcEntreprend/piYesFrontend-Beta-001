// pages/ForgotPassword.tsx

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Mail, Lock, CheckCircle2 } from "lucide-react";
import { useTranslation } from "../App";
import { api } from "../services/apiService";
import Button from "../components/Button";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState(
    location.state?.identifier || "",
  );
  const [normalizedId, setNormalizedId] = useState(""); // version normalisée pour les appels API
  const [step, setStep] = useState(1); // 1: identifier, 2: OTP, 3: New Password, 4: Success
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Normaliser le phone ou email avant envoi
  const normalizeIdentifier = (raw: string): string => {
    let target = raw.trim().replace(/\s+/g, "");
    if (!target.includes("@")) {
      const digits = target.replace(/\D/g, "");
      if (digits.length >= 8) {
        if (digits.startsWith("509") && digits.length === 11)
          return `+${digits}`;
        if (digits.length === 8) return `+509${digits}`;
      }
      return target.startsWith("+") ? target : `+509${target}`;
    } else {
      return target.toLowerCase();
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    setLoading(true);
    setError("");
    try {
      const norm = normalizeIdentifier(identifier);
      setNormalizedId(norm);
      await api.forgotPassword(norm);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi du code");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 : vérifier le code avant de passer à step 3
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) return;

    setLoading(true);
    setError("");
    try {
      // Vérifier via otp/verify (consume = false côté backend)
      const isValid = await api.verifyOtp(normalizedId, otpCode);
      if (isValid) {
        setStep(3);
      } else {
        setError("Code incorrect ou expiré. Réessayez.");
        setOtp(["", "", "", "", "", ""]);
        document.getElementById("otp-0")?.focus();
      }
    } catch (err: any) {
      setError(err.message || "Code incorrect ou expiré.");
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Utiliser l'identifier normalisé pour le reset
      await api.resetPassword(normalizedId, otp.join(""), newPassword);
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la réinitialisation");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return; // chiffres uniquement
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    setOtp(["", "", "", "", "", ""]);
    try {
      await api.resendOtp(normalizedId);
      setError(""); // pas d'erreur = succès
    } catch (err: any) {
      setError("Erreur lors du renvoi. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen theme-bg flex flex-col">
      <header className="p-4 flex items-center gap-4 theme-bg border-b theme-border">
        <Button
          variant="utility"
          size="sm"
          onClick={() => {
            if (step > 1) setStep(step - 1);
            else navigate(-1);
          }}
          leftIcon={<ArrowLeft className="w-6 h-6" />}
          className="p-2"
        />
        <h1 className="text-xl font-bold theme-text-main">
          {t("auth.forgot_password")}
        </h1>
      </header>

      {/* Indicateur d'étapes */}
      {step < 4 && (
        <div className="flex gap-2 px-6 pt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? "theme-primary-bg" : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>
      )}

      <main className="flex-1 p-6 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full theme-card-bg p-8 rounded-3xl shadow-sm border theme-border"
        >
          {/* ── STEP 1 : Identifiant ─────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 theme-bubble-bg theme-primary-text rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold theme-text-main">
                  Récupération
                </h2>
                <p className="text-sm theme-text-secondary">
                  Entrez votre email ou numéro de téléphone pour recevoir un
                  code de vérification.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium theme-text-secondary">
                  Email ou téléphone
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 theme-text-secondary opacity-50" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError("");
                    }}
                    className="w-full pl-12 pr-4 py-4 theme-bg border theme-border rounded-2xl focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent outline-none transition-all theme-text-main"
                    placeholder="email@exemple.com ou +509XXXXXXXX"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button
                variant="primary"
                fullWidth
                type="submit"
                disabled={!identifier.trim()}
                isLoading={loading}
                className="py-4 font-bold"
              >
                {t("common.continue")}
              </Button>
            </form>
          )}

          {/* ── STEP 2 : Code OTP ─────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold theme-text-main">
                  Code de vérification
                </h2>
                <p className="text-sm theme-text-secondary">
                  Code envoyé à{" "}
                  <span className="font-bold theme-primary-text">
                    {normalizedId}
                  </span>
                </p>
                {/* Badge dev mode */}
                <div className="inline-block px-3 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-full">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                    Dev mode — code : vérifiez les logs serveur
                  </p>
                </div>
              </div>

              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none ${
                      digit
                        ? "theme-primary-bg text-white border-transparent"
                        : "theme-bg theme-border focus:border-[var(--primary-color)] theme-text-main"
                    }`}
                    required
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button
                variant="primary"
                fullWidth
                type="submit"
                disabled={otp.join("").length < 6}
                isLoading={loading}
                className="py-4 font-bold"
              >
                {t("common.verify")}
              </Button>

              <Button
                variant="text"
                fullWidth
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="theme-primary-text font-medium text-sm"
              >
                {t("auth.resend_code")}
              </Button>
            </form>
          )}

          {/* ── STEP 3 : Nouveau mot de passe ─────────────────────────── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold theme-text-main">
                  Nouveau mot de passe
                </h2>
                <p className="text-sm theme-text-secondary">
                  Créez un mot de passe sécurisé (min. 6 caractères).
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium theme-text-secondary">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError("");
                    }}
                    className="w-full px-4 py-4 theme-bg border theme-border rounded-2xl focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent outline-none transition-all theme-text-main"
                    placeholder="••••••••"
                    required
                    autoFocus
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium theme-text-secondary">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    className="w-full px-4 py-4 theme-bg border theme-border rounded-2xl focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent outline-none transition-all theme-text-main"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Indicateur de correspondance */}
              {confirmPassword && (
                <p
                  className={`text-xs font-bold ${newPassword === confirmPassword ? "text-green-500" : "text-red-500"}`}
                >
                  {newPassword === confirmPassword
                    ? "✓ Les mots de passe correspondent"
                    : "✗ Les mots de passe ne correspondent pas"}
                </p>
              )}

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button
                variant="primary"
                fullWidth
                type="submit"
                disabled={
                  !newPassword ||
                  newPassword !== confirmPassword ||
                  newPassword.length < 6
                }
                isLoading={loading}
                className="py-4 font-bold"
              >
                {t("auth.reset_password_btn")}
              </Button>
            </form>
          )}

          {/* ── STEP 4 : Succès ──────────────────────────────────────── */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold theme-text-main">Succès !</h2>
                <p className="text-sm theme-text-secondary">
                  Votre mot de passe a été réinitialisé. Vous pouvez maintenant
                  vous connecter avec votre nouveau mot de passe.
                </p>
              </div>
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate("/login")}
                className="py-4 font-bold"
              >
                {t("auth.login_btn")}
              </Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default ForgotPassword;
