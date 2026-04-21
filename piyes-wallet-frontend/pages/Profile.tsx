//pages/Profile.tsx

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Smartphone,
  Save,
  ShieldCheck,
  Camera,
  Trash2,
  Calendar,
  MapPin,
  Globe,
  CreditCard,
  ChevronRight,
  LogOut,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Edit2,
  FileUser,
  QrCode as QrIcon,
  Loader2,
  X,
} from "lucide-react";
import { api } from "../services/apiService";
import { User as UserType, getInitials } from "../shared/types";
import { useTranslation, useToast } from "../App";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";

interface ProfileProps {
  user: UserType;
  onUpdate: (user: UserType) => void;
  onLogout: () => void;
}

const ProfileSection = ({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children?: React.ReactNode;
}) => (
  <div
    id={id}
    className="space-y-4 transition-all duration-500 p-2 rounded-2xl"
  >
    <h3 className="px-1 text-[11px] font-bold theme-text-secondary uppercase tracking-[0.2em]">
      {title}
    </h3>
    <div className="bg-gray-50 dark:bg-white/5 rounded-4xl border theme-border overflow-hidden">
      {children}
    </div>
  </div>
);

const ProfileField = ({
  icon,
  label,
  value,
  name,
  type = "text",
  disabled = false,
  isEditing,
  onChange,
}: any) => (
  <div className="flex items-center gap-4 p-4 border-b theme-border last:border-b-0">
    <div className="w-10 h-10 rounded-xl theme-bubble-bg flex items-center justify-center theme-primary-text shrink-0">
      {icon}
    </div>
    <div className="flex-1 space-y-0.5">
      <label className="text-[9px] font-bold theme-text-secondary uppercase tracking-wider">
        {label}
      </label>
      {isEditing && !disabled ? (
        <input
          type={type}
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          className="w-full bg-transparent theme-text-main font-bold text-sm outline-none border-b border-(--primary-color) pb-0.5"
        />
      ) : (
        <p
          className={`text-sm font-bold ${disabled ? "theme-text-secondary opacity-60 italic" : "theme-text-main"}`}
        >
          {value || "---"}
        </p>
      )}
    </div>
  </div>
);

const Profile: React.FC<ProfileProps> = ({ user, onUpdate, onLogout }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState({
    name: user.name || "",
    tag: user.tag || "",
    email: user.email || "",
    phone: user.phone || "",
    dob: user.dob || "",
    address: user.address || "",
    nationality: user.nationality || "Haïtienne",
    idNumber: user.idNumber || "",
    language: user.language || "Français",
    timezone: user.timezone || "GMT-5 (Haïti)",
    avatarUrl: user.avatarUrl || "",
  });

  // Valeurs "avant modification" pour rollback si OTP annulé
  const [originalEmail, setOriginalEmail] = useState(user.email || "");
  const [originalPhone, setOriginalPhone] = useState(user.phone || "");

  // States OTP inline (par champ)
  const [pendingEmailOtp, setPendingEmailOtp] = useState(false); // OTP demandé pour email
  const [pendingPhoneOtp, setPendingPhoneOtp] = useState(false); // OTP demandé pour phone
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [phoneOtpCode, setPhoneOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Crop d'image
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropImg, setCropImg] = useState<HTMLImageElement | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCheckingTag, setIsCheckingTag] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (searchParams.get("edit") === "true") setIsEditing(true);
  }, [searchParams]);

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── OTP par champ : déclenché quand le champ email/phone perd le focus ──
  const handleEmailBlur = async () => {
    const newEmail = formData.email.trim();
    if (!newEmail || newEmail === originalEmail) return;
    if (!newEmail.includes("@") || !newEmail.includes(".")) return; // validation basique

    setSendingOtp(true);
    try {
      await api.requestOtp(newEmail.toLowerCase(), "email");
      setPendingEmailOtp(true);
    } catch (e) {
      showToast(t("profile_hub.errors.otp_email_failed"), "error");
      setFormData((prev) => ({ ...prev, email: originalEmail })); // rollback
    }
    setSendingOtp(false);
  };

  const handlePhoneBlur = async () => {
    const newPhone = formData.phone.replace(/\D/g, "").replace("509", "");
    if (
      !newPhone ||
      newPhone === originalPhone.replace(/\D/g, "").replace("509", "")
    )
      return;
    if (newPhone.length < 8) return;

    setSendingOtp(true);
    try {
      await api.requestOtp(`+509${newPhone}`, "sms");
      setPendingPhoneOtp(true);
    } catch (e) {
      showToast(t("profile_hub.errors.otp_sms_failed"), "error");
      setFormData((prev) => ({ ...prev, phone: originalPhone })); // rollback
    }
    setSendingOtp(false);
  };

  const handleVerifyEmailOtp = async () => {
    if (emailOtpCode.length < 6) return;
    setVerifyingOtp(true);
    try {
      // Vérifier via l'API OTP
      await api.verifyOtp(formData.email.toLowerCase(), emailOtpCode);
      setPendingEmailOtp(false);
      setEmailOtpCode("");
      setOriginalEmail(formData.email); // valider la nouvelle valeur
      showToast(t("profile_hub.success.email_verified"), "success");
    } catch (e) {
      showToast(t("profile_hub.errors.code_incorrect"), "error");
    }
    setVerifyingOtp(false);
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtpCode.length < 6) return;
    setVerifyingOtp(true);
    try {
      await api.verifyOtp(
        `+509${formData.phone.replace(/\D/g, "").replace("509", "")}`,
        phoneOtpCode,
      );
      setPendingPhoneOtp(false);
      setPhoneOtpCode("");
      setOriginalPhone(formData.phone);
      showToast(t("profile_hub.success.phone_verified"), "success");
    } catch (e) {
      showToast(t("profile_hub.errors.code_incorrect"), "error");
    }
    setVerifyingOtp(false);
  };

  const handleCancelEmailOtp = () => {
    setPendingEmailOtp(false);
    setEmailOtpCode("");
    setFormData((prev) => ({ ...prev, email: originalEmail }));
    showToast(t("profile_hub.info.no_email_modified"), "info");
  };

  const handleCancelPhoneOtp = () => {
    setPendingPhoneOtp(false);
    setPhoneOtpCode("");
    setFormData((prev) => ({ ...prev, phone: originalPhone }));
    showToast(t("profile_hub.info.no_phone_modified"), "info");
  };

  // ── Gestion avatar avec crop ─────────────────────────────────────────────
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImageSrc(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    // Reset input pour permettre re-sélection du même fichier
    e.target.value = "";
  };

  const handleCropConfirm = () => {
    if (!cropImg || !cropCanvasRef.current) return;
    const canvas = cropCanvasRef.current;
    const size = Math.min(cropImg.naturalWidth, cropImg.naturalHeight);
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Découpe centrée avec offset
    const sx = (cropImg.naturalWidth - size) / 2 + cropOffset.x;
    const sy = (cropImg.naturalHeight - size) / 2 + cropOffset.y;
    ctx.drawImage(cropImg, sx, sy, size, size, 0, 0, 256, 256);
    const croppedUrl = canvas.toDataURL("image/jpeg", 0.85);
    setFormData((prev) => ({ ...prev, avatarUrl: croppedUrl }));
    setShowCropModal(false);
    setRawImageSrc(null);
    setCropImg(null);
    setCropOffset({ x: 0, y: 0 });
  };

  const resetAvatar = () => {
    setFormData((prev) => ({ ...prev, avatarUrl: "" }));
  };

  // ── Sauvegarde du profil ─────────────────────────────────────────────────
  const handleSave = async () => {
    // Validation champs obligatoires
    const hasContact =
      (formData.email && formData.email.includes("@")) ||
      (formData.phone && formData.phone.replace(/\D/g, "").length >= 8);
    if (!hasContact) {
      showToast(t("profile_hub.errors.contact_required"), "error");
      return;
    }
    if (!formData.name?.trim()) {
      showToast(t("profile_hub.errors.name_required"), "error");
      return;
    }
    if (!formData.tag?.trim()) {
      showToast(t("profile_hub.errors.tag_required"), "error");
      return;
    }

    // Bloquer si OTP en attente
    if (pendingEmailOtp) {
      showToast(t("profile_hub.errors.verify_email_first"), "error");
      return;
    }
    if (pendingPhoneOtp) {
      showToast(t("profile_hub.errors.verify_phone_first"), "error");
      return;
    }

    setSaving(true);
    try {
      // Passer uniquement les champs NON-sensibles au backend
      // Email et phone ont déjà été vérifiés via OTP inline → les inclure est safe
      const updatedUser = await api.updateProfile({
        name: formData.name,
        tag: formData.tag,
        email: formData.email, // déjà vérifié via OTP si modifié
        phone: formData.phone
          ? `+509${formData.phone.replace(/\D/g, "").replace("509", "")}`
          : "",
        dob: formData.dob,
        address: formData.address,
        nationality: formData.nationality,
        idNumber: formData.idNumber,
        language: formData.language,
        timezone: formData.timezone,
        avatarUrl: formData.avatarUrl,
      });
      onUpdate(updatedUser);
      setIsEditing(false);
      setOriginalEmail(formData.email);
      setOriginalPhone(formData.phone);
      showToast(t("profile_hub.save_success"), "success");
    } catch (error: any) {
      showToast(error.message || t("common.error"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="theme-card-bg min-h-screen flex flex-col animate-in fade-in duration-500 pb-32">
      {/* Canvas invisible pour le crop */}
      <canvas ref={cropCanvasRef} className="hidden" />

      <PageHeader
        title={t("profile_hub.title")}
        rightElement={
          !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="theme-bubble-bg theme-primary-text px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 active:scale-95 transition-all"
            >
              <Edit2 size={14} /> {t("common.edit")}
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="theme-primary-bg text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 active:scale-95 transition-all shadow-lg"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Save size={14} />
              )}
              {t("common.save")}
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Avatar */}
        <div className="px-6 py-10 flex flex-col items-center space-y-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-2xl overflow-hidden bg-gray-100 relative flex items-center justify-center">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-black theme-primary-text">
                  {user.initials || getInitials(user.name)}
                </span>
              )}
              {isEditing && (
                <div
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={32} className="text-white" />
                </div>
              )}
            </div>
            {isEditing && (
              <div className="absolute -bottom-2 flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-white dark:bg-gray-800 shadow-lg rounded-full border theme-border theme-primary-text active:scale-90"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={resetAvatar}
                  className="p-2 bg-white dark:bg-gray-800 shadow-lg rounded-full border theme-border text-red-500 active:scale-90"
                >
                  <Trash2 size={16} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarFileSelect}
                />
              </div>
            )}
            {!isEditing && user.verificationStatus === "verified" && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-full border-4 border-white dark:border-gray-800 shadow-lg">
                <ShieldCheck size={20} />
              </div>
            )}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold theme-text-main leading-tight">
              {formData.name}
            </h2>
            <p className="text-sm font-bold theme-primary-text mt-0.5">
              {user.tag || "@piyes.user"}
            </p>
            <p className="text-[10px] theme-text-secondary font-medium mt-1 uppercase tracking-widest">
              {t("profile_hub.account_number")} {user.accountNumber}
            </p>
          </div>
        </div>

        {/* Verification block */}
        <div className="px-6 mb-8">
          {user.verificationStatus === "verified" ? (
            <div className="p-6 bg-green-50 dark:bg-green-900/10 rounded-4xl border border-green-200 dark:border-green-900/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">
                    {t("profile_hub.verified_box.title")}
                  </p>
                  <p className="text-[10px] text-green-600 font-medium">
                    {t("profile_hub.verified_box.sub")}
                  </p>
                </div>
              </div>
              <span className="bg-white/50 px-3 py-1 rounded-full text-[9px] font-black text-green-700 uppercase tracking-tighter">
                {t("profile_hub.verified_box.badge")}
              </span>
            </div>
          ) : (
            <div className="p-6 theme-primary-bg rounded-4xl shadow-xl text-white space-y-6 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
                <Shield size={120} />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold">
                    {t("profile_hub.verify_box.title")}
                  </h4>
                  <p className="text-xs opacity-80 leading-relaxed">
                    {t("profile_hub.verify_box.sub")}
                  </p>
                </div>
              </div>
              <p className="text-[10px] opacity-70 leading-relaxed">
                {t("profile_hub.verify_box.process")}
              </p>
              <button
                onClick={() => navigate("/verify-identity")}
                className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
              >
                {t("profile_hub.verify_box.btn")} <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="px-6 space-y-8 pb-10">
          <ProfileSection
            id="personal-info"
            title={t("profile_hub.sections.personal")}
          >
            <button
              onClick={() => navigate("/identity-hub")}
              className="w-full flex items-center justify-between p-4 border-b theme-border hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl theme-bubble-bg flex items-center justify-center theme-primary-text group-hover:scale-110 transition-transform">
                  <QrIcon size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold theme-text-main">
                    {t("profile_hub.identity_hub_title")}
                  </p>
                  <p className="text-[10px] theme-text-secondary">
                    {t("profile_hub.identity_hub_sub")}
                  </p>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="theme-text-secondary opacity-30"
              />
            </button>

            <ProfileField
              icon={<UserIcon size={18} />}
              label={t("profile_hub.fields.name")}
              value={formData.name}
              name="name"
              isEditing={isEditing}
              onChange={handleFieldChange}
            />

            {/* Tag */}
            <div className="flex items-center gap-4 p-4 border-b theme-border last:border-b-0">
              <div className="w-10 h-10 rounded-xl theme-bubble-bg flex items-center justify-center theme-primary-text shrink-0">
                <Edit2 size={18} />
              </div>
              <div className="flex-1 space-y-0.5">
                <label className="text-[9px] font-bold theme-text-secondary uppercase tracking-wider">
                  {t("profile_hub.fields.tag")}
                </label>
                {isEditing ? (
                  <div className="relative">
                    <span className="absolute left-0 bottom-0.5 font-bold theme-text-secondary">
                      @
                    </span>
                    <input
                      type="text"
                      name="tag"
                      value={
                        formData.tag.startsWith("@")
                          ? formData.tag.substring(1)
                          : formData.tag
                      }
                      onChange={(e) =>
                        handleFieldChange(
                          "tag",
                          `@${e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")}`,
                        )
                      }
                      className={`w-full bg-transparent theme-text-main font-bold text-sm outline-none border-b pb-0.5 pl-4 ${tagError ? "border-red-500" : "border-(--primary-color)"}`}
                    />
                    {isCheckingTag && (
                      <Loader2
                        size={14}
                        className="absolute right-0 bottom-1 animate-spin theme-primary-text"
                      />
                    )}
                    {tagError && (
                      <p className="text-[8px] text-red-500 font-bold mt-1">
                        {tagError}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-bold theme-text-main">
                    {formData.tag || "---"}
                  </p>
                )}
              </div>
            </div>

            <ProfileField
              icon={<Calendar size={18} />}
              label={t("profile_hub.fields.dob")}
              value={formData.dob}
              name="dob"
              type="date"
              isEditing={isEditing}
              onChange={handleFieldChange}
            />

            {/* Email avec OTP inline */}
            <div className="flex items-start gap-4 p-4 border-b theme-border">
              <div className="w-10 h-10 rounded-xl theme-bubble-bg flex items-center justify-center theme-primary-text shrink-0 mt-1">
                <Mail size={18} />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-[9px] font-bold theme-text-secondary uppercase tracking-wider">
                  {t("profile_hub.fields.email")}
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    onBlur={handleEmailBlur}
                    className="w-full bg-transparent theme-text-main font-bold text-sm outline-none border-b border-(--primary-color) pb-0.5"
                  />
                ) : (
                  <p className="text-sm font-bold theme-text-main">
                    {formData.email || "---"}
                  </p>
                )}
                {/* Bandeau OTP email inline */}
                {pendingEmailOtp && (
                  <div className="space-y-2 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-200 dark:border-purple-900/30">
                    <p className="text-[10px] text-purple-700 dark:text-purple-400 font-bold">
                      {t("profile_hub.otp_sent_to", { target: formData.email })}
                    </p>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={emailOtpCode}
                      onChange={(e) =>
                        setEmailOtpCode(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full text-center text-lg font-black tracking-[0.4em] bg-white dark:bg-black/20 p-2 rounded-xl border border-purple-200 outline-none focus:border-(--primary-color) theme-text-main"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleVerifyEmailOtp}
                        disabled={emailOtpCode.length < 6 || verifyingOtp}
                        className="flex-1 py-2 theme-primary-bg text-white rounded-xl text-xs font-bold disabled:opacity-40"
                      >
                        {verifyingOtp ? (
                          <Loader2 size={14} className="animate-spin mx-auto" />
                        ) : (
                          t("profile_hub.verify")
                        )}
                      </button>
                      <button
                        onClick={handleCancelEmailOtp}
                        className="px-3 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold border border-red-100"
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Phone avec OTP inline */}
            <div className="flex items-start gap-4 p-4 border-b theme-border last:border-b-0">
              <div className="w-10 h-10 rounded-xl theme-bubble-bg flex items-center justify-center theme-primary-text shrink-0 mt-1">
                <Smartphone size={18} />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-[9px] font-bold theme-text-secondary uppercase tracking-wider">
                  {t("profile_hub.fields.phone")}
                </label>
                {isEditing ? (
                  <div className="relative">
                    <span className="absolute left-0 bottom-0.5 font-bold theme-text-secondary">
                      +509
                    </span>
                    <input
                      type="tel"
                      maxLength={8}
                      value={formData.phone
                        .replace("+509", "")
                        .replace(/\D/g, "")}
                      onChange={(e) =>
                        handleFieldChange(
                          "phone",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                      onBlur={handlePhoneBlur}
                      className="w-full bg-transparent theme-text-main font-bold text-sm outline-none border-b border-(--primary-color) pb-0.5 pl-10"
                    />
                  </div>
                ) : (
                  <p className="text-sm font-bold theme-text-main">
                    {formData.phone ? `+509 ${formData.phone}` : "---"}
                  </p>
                )}
                {/* Bandeau OTP phone inline */}
                {pendingPhoneOtp && (
                  <div className="space-y-2 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-200 dark:border-purple-900/30">
                    <p className="text-[10px] text-purple-700 dark:text-purple-400 font-bold">
                      {t("profile_hub.otp_sent_to_phone", {
                        target: formData.phone,
                      })}
                    </p>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={phoneOtpCode}
                      onChange={(e) =>
                        setPhoneOtpCode(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full text-center text-lg font-black tracking-[0.4em] bg-white dark:bg-black/20 p-2 rounded-xl border border-purple-200 outline-none focus:border-(--primary-color) theme-text-main"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleVerifyPhoneOtp}
                        disabled={phoneOtpCode.length < 6 || verifyingOtp}
                        className="flex-1 py-2 theme-primary-bg text-white rounded-xl text-xs font-bold disabled:opacity-40"
                      >
                        {verifyingOtp ? (
                          <Loader2 size={14} className="animate-spin mx-auto" />
                        ) : (
                          t("profile_hub.verify")
                        )}
                      </button>
                      <button
                        onClick={handleCancelPhoneOtp}
                        className="px-3 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold border border-red-100"
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <ProfileField
              icon={<MapPin size={18} />}
              label={t("profile_hub.fields.address")}
              value={formData.address}
              name="address"
              isEditing={isEditing}
              onChange={handleFieldChange}
            />
          </ProfileSection>

          <ProfileSection
            id="identity-docs"
            title={t("profile_hub.sections.identity")}
          >
            <ProfileField
              icon={<Globe size={18} />}
              label={t("profile_hub.fields.nationality")}
              value={formData.nationality}
              name="nationality"
              disabled={true}
              isEditing={isEditing}
              onChange={handleFieldChange}
            />
            <ProfileField
              icon={<CreditCard size={18} />}
              label={t("profile_hub.fields.id_number")}
              value={formData.idNumber}
              name="idNumber"
              isEditing={isEditing}
              onChange={handleFieldChange}
            />
          </ProfileSection>

          <ProfileSection
            id="account-prefs"
            title={t("profile_hub.sections.prefs")}
          >
            <ProfileField
              icon={<Globe size={18} />}
              label={t("profile_hub.fields.language")}
              value={formData.language}
              name="language"
              isEditing={isEditing}
              onChange={handleFieldChange}
            />
            <ProfileField
              icon={<Clock size={18} />}
              label={t("profile_hub.fields.timezone")}
              value={formData.timezone}
              name="timezone"
              disabled={true}
              isEditing={isEditing}
              onChange={handleFieldChange}
            />
          </ProfileSection>

          <ProfileSection
            id="security-hub"
            title={t("profile_hub.sections.security")}
          >
            <button
              onClick={() => navigate("/security")}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl theme-bubble-bg flex items-center justify-center theme-primary-text group-hover:scale-110 transition-transform">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold theme-text-main">
                    {t("profile_hub.security_items.history.label")}
                  </p>
                  <p className="text-[10px] theme-text-secondary">
                    {t("profile_hub.security_items.history.sub")}
                  </p>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="theme-text-secondary opacity-30"
              />
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-4 p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all border-t theme-border"
            >
              <LogOut size={18} />
              <span className="text-sm font-bold">
                {t("profile_hub.logout_btn")}
              </span>
            </button>
          </ProfileSection>
        </div>
      </div>

      {isEditing && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm animate-in slide-in-from-bottom duration-300">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full theme-primary-bg text-white py-4 rounded-full font-bold shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {t("profile_hub.save_btn")}
          </button>
        </div>
      )}

      {/* Modal crop d'image */}
      {showCropModal && rawImageSrc && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="w-full max-w-sm theme-card-bg rounded-4xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black theme-text-main">
                {t("profile_hub.crop_title")}
              </h3>
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setRawImageSrc(null);
                }}
                className="p-2 theme-bubble-bg rounded-full theme-text-secondary active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            {/* Preview cercle avec drag pour repositionner */}
            <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-(--primary-color) shadow-xl">
              <img
                src={rawImageSrc}
                alt="crop preview"
                className="absolute w-full h-full object-cover"
                style={{
                  transform: `translate(${cropOffset.x}px, ${cropOffset.y}px)`,
                }}
                onLoad={(e) => setCropImg(e.currentTarget as HTMLImageElement)}
                draggable={false}
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setCropOffset((o) => ({ ...o, x: o.x - 10 }))}
                className="py-3 theme-bubble-bg rounded-xl text-sm font-bold theme-text-main border theme-border active:scale-95"
              >
                ←
              </button>
              <button
                onClick={() => setCropOffset((o) => ({ ...o, x: o.x + 10 }))}
                className="py-3 theme-bubble-bg rounded-xl text-sm font-bold theme-text-main border theme-border active:scale-95"
              >
                →
              </button>
              <button
                onClick={() => setCropOffset((o) => ({ ...o, y: o.y - 10 }))}
                className="py-3 theme-bubble-bg rounded-xl text-sm font-bold theme-text-main border theme-border active:scale-95"
              >
                ↑
              </button>
              <button
                onClick={() => setCropOffset((o) => ({ ...o, y: o.y + 10 }))}
                className="py-3 theme-bubble-bg rounded-xl text-sm font-bold theme-text-main border theme-border active:scale-95"
              >
                ↓
              </button>
            </div>

            <p className="text-[9px] theme-text-secondary text-center">
              {t("profile_hub.crop_hint")}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setRawImageSrc(null);
                  setCropOffset({ x: 0, y: 0 });
                }}
                className="flex-1 py-3 theme-bubble-bg theme-text-secondary rounded-2xl font-bold text-sm border theme-border active:scale-95"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 py-3 theme-primary-bg text-white rounded-2xl font-bold text-sm shadow-lg active:scale-95"
              >
                {t("profile_hub.apply")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
      >
        <div className="p-8 space-y-6">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center text-red-500 mx-auto">
            <LogOut size={32} />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black theme-text-main">
              {t("settings.logout_confirm_title")}
            </h2>
            <p className="text-sm theme-text-secondary">
              {t("settings.logout_confirm_desc")}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 p-4 rounded-2xl theme-bubble-bg theme-text-main font-bold active:scale-95 transition-all"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={async () => {
                setShowLogoutConfirm(false);
                await api.logoutAllSessions();
                onLogout();
              }}
              className="flex-1 p-4 rounded-2xl bg-red-500 text-white font-bold active:scale-95 transition-all shadow-lg shadow-red-500/20"
            >
              {t("settings.logout")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
