//pages/Profile.tsx

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
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
import AvatarViewer from "../components/AvatarViewer";
import { cacheService } from "../services/cacheService";

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

  // states pour les modification
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingExitAction, setPendingExitAction] = useState<(() => void) | null>(null);


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
  const [cropImg, setCropImg] = useState<HTMLImageElement | null>(null);

  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  // states pour drag et zoom
  const [cropScale, setCropScale] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [minScale, setMinScale] = useState(1);
  const [maxScale, setMaxScale] = useState(3);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCheckingTag, setIsCheckingTag] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // State pour la visualisation de l'avatar
  const [showFullscreenAvatar, setShowFullscreenAvatar] = useState(false);
  const [fullscreenScale, setFullscreenScale] = useState(1);
  const [fullscreenPosition, setFullscreenPosition] = useState({ x: 0, y: 0 });
  const [isFullscreenDragging, setIsFullscreenDragging] = useState(false);
  const [fullscreenDragStart, setFullscreenDragStart] = useState({ x: 0, y: 0 });
  const [isClosingBySwipe, setIsClosingBySwipe] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [avatarRect, setAvatarRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (searchParams.get("edit") === "true") setIsEditing(true);
  }, [searchParams]);

  // Track unsaved changes
  useEffect(() => {
    if (!isEditing) {
      setHasUnsavedChanges(false);
      return;
    }
    const original = {
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
    };
    const changed = JSON.stringify(formData) !== JSON.stringify(original);
    setHasUnsavedChanges(changed);
  }, [formData, isEditing, user]);

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setPendingExitAction(() => () => {
        setFormData({
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
        setIsEditing(false);
        setPendingEmailOtp(false);
        setPendingPhoneOtp(false);
      });
      setShowExitConfirm(true);
    } else {
      setFormData({
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
      setIsEditing(false);
      setPendingEmailOtp(false);
      setPendingPhoneOtp(false);
    }
  };

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

  // Ouvrir la caméra native
  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // 'user' pour frontale, 'environment' pour arrière
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawImageSrc(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Calculer l'échelle minimale pour que l'image remplisse le cercle
  const calculateMinScale = (img: HTMLImageElement, containerSize: number) => {
    const imgSize = Math.min(img.naturalWidth, img.naturalHeight);
    return containerSize / imgSize;
  };

  // Gestionnaires de drag
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setDragStart({ x: clientX - cropPosition.x, y: clientY - cropPosition.y });
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    let newX = clientX - dragStart.x;
    let newY = clientY - dragStart.y;

    // Limites avec effet ressort léger
    const maxOffset = 50 * cropScale;
    newX = Math.max(-maxOffset, Math.min(maxOffset, newX));
    newY = Math.max(-maxOffset, Math.min(maxOffset, newY));

    setCropPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Gestionnaire de zoom (wheel + slider)
  const handleZoom = (delta: number) => {
    setCropScale(prev => {
      const newScale = Math.max(minScale, Math.min(maxScale, prev + delta));
      // Ajuster la position si on dézoome pour rester dans les limites
      if (newScale < prev) {
        setCropPosition(pos => ({
          x: pos.x * (newScale / prev),
          y: pos.y * (newScale / prev)
        }));
      }
      return newScale;
    });
  };

  // Slider de zoom
  const handleSliderChange = (value: number) => {
    const newScale = minScale + (value / 100) * (maxScale - minScale);
    setCropScale(newScale);
  };

  // Reset zoom et position
  const resetCropPosition = () => {
    // Revenir au zoom qui remplit le cercle
    setCropScale(minScale * 1.1);
    setCropPosition({ x: 0, y: 0 });
  };

  // FONCTIONS - Gestion du plein écran
  const openFullscreenAvatar = () => {
    if (!formData.avatarUrl) return;

    // Capturer la position de l'avatar pour l'animation
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      setAvatarRect(rect);
    }

    setFullscreenScale(1);
    setFullscreenPosition({ x: 0, y: 0 });
    setIsClosingBySwipe(false);
    setShowFullscreenAvatar(true);
  };

  const closeFullscreenAvatar = () => {
    setShowFullscreenAvatar(false);
    setFullscreenScale(1);
    setFullscreenPosition({ x: 0, y: 0 });
    setIsClosingBySwipe(false);
  };

  // Gestionnaires de drag - uniquement vertical pour fermer
  const handleFullscreenDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setIsFullscreenDragging(true);
    setFullscreenDragStart({
      x: 0,
      y: clientY - fullscreenPosition.y
    });
  };

  const handleFullscreenDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isFullscreenDragging) return;
    e.preventDefault();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    let newY = clientY - fullscreenDragStart.y;

    // Permettre de tirer vers le bas pour fermer (effet ressort)
    const maxPullDown = 200;
    newY = Math.max(-50, Math.min(maxPullDown, newY));

    setFullscreenPosition({ x: 0, y: newY });

    // Si on tire assez vers le bas, déclencher la fermeture
    if (newY > 120) {
      setIsClosingBySwipe(true);
    } else {
      setIsClosingBySwipe(false);
    }
  };

  const handleFullscreenDragEnd = () => {
    if (isClosingBySwipe) {
      closeFullscreenAvatar();
    } else {
      // Retour à la position normale avec ressort
      setFullscreenPosition({ x: 0, y: 0 });
    }
    setIsFullscreenDragging(false);
    setIsClosingBySwipe(false);
  };

  // Gestion du pinch-to-zoom (simulé via wheel pour desktop)
  const handleFullscreenWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setFullscreenScale(prev => {
      const newScale = Math.max(1, Math.min(3, prev + delta));
      return newScale;
    });
  };

  // Reset zoom au double-clic
  const handleFullscreenDoubleClick = () => {
    setFullscreenScale(1);
    setFullscreenPosition({ x: 0, y: 0 });
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

      // Invalider les caches pour forcer le rafraîchissement
      cacheService.invalidate("sync");
      cacheService.invalidate("keys");

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
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelEdit}
                className="theme-bubble-bg theme-text-secondary px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
              >
                <X size={14} /> {t("common.cancel")}
              </button>
              <button
                onClick={resetAvatar}
                className="theme-bubble-bg text-red-500 p-2 rounded-full active:scale-90 transition-all"
              >
                <Trash2 size={14} />
              </button>
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
            </div>
          )
        }
      />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Avatar Header - style horizontal */}
        <div className="px-6 py-8 flex items-center gap-4 border-b theme-border">
          <div className="relative group shrink-0">
            <AvatarViewer
              avatarUrl={formData.avatarUrl}
              size="lg"
              shape="circle"
              disablePreview={isEditing}
              fallback={
                <span className="text-2xl font-black theme-primary-text">
                  {(user.name || "??")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </span>
              }
              className="border-2 border-(--primary-color) shadow-sm"
            />

            {/* Overlay d'édition - apparaît au hover */}
            {isEditing && (
              <div
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full z-10"
                onClick={() => setShowAvatarMenu(true)}
              >
                <Camera size={24} className="text-white" />
              </div>
            )}

            {/* Badge vérifié */}
            {!isEditing && user.verificationStatus === "verified" && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white dark:border-gray-800 shadow-lg z-10">
                <ShieldCheck size={14} />
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarFileSelect}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold theme-text-main truncate">
              {formData.name}
            </h2>
            <p className="text-xs font-bold theme-primary-text">
              {user.tag || "@piyes.user"}
            </p>
            <p className="text-[10px] theme-text-secondary font-bold uppercase tracking-widest">
              {t("profile_hub.account_number")} {user.accountNumber}
            </p>
          </div>
        </div>

        {/* Verification Status Button - Only show when not editing */}
        {!isEditing && (
          <div className="px-6 space-y-8 pb-10">
            {user.verificationStatus === "verified" ? (
              <button
                onClick={() => navigate("/identity-hub")}
                className="w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 rounded-4xl border border-green-200 dark:border-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/20 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={20} />
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
                <div className="flex items-center gap-2">
                  <span className="bg-white/50 px-3 py-1 rounded-full text-[9px] font-black text-green-700 uppercase tracking-tighter">
                    {t("profile_hub.verified_box.badge")}
                  </span>
                  <ChevronRight
                    size={18}
                    className="text-green-600 opacity-50 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </button>
            ) : (
              <button
                onClick={() => navigate("/verify-identity")}
                className="w-full flex items-center justify-between p-4 theme-primary-bg rounded-4xl shadow-xl text-white hover:brightness-110 transition-all text-left group relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
                  <Shield size={80} />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">
                      {t("profile_hub.verify_box.title")}
                    </p>
                    <p className="text-[10px] opacity-80">
                      {t("profile_hub.verify_box.sub")}
                    </p>
                  </div>
                </div>
                <div className="relative z-10 flex items-center gap-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">
                    {t("profile_hub.verify_box.btn")}
                  </span>
                  <ChevronRight
                    size={18}
                    className="opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </button>
            )}
          </div>
        )}

        <div className="px-6 space-y-8 pb-10 mt-8">
          <ProfileSection
            id="personal-info"
            title={t("profile_hub.sections.personal")}
          >
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
                  <div className="relative flex items-baseline">
                    <span className="font-bold theme-text-secondary text-sm shrink-0">
                      +509&nbsp;
                    </span>
                    <input
                      type="tel"
                      maxLength={9}
                      value={
                        (() => {
                          const digits = formData.phone
                            .replace("+509", "")
                            .replace(/\D/g, "");
                          if (digits.length <= 4) return digits;
                          return `${digits.slice(0, 4)} ${digits.slice(4)}`;
                        })()
                      }
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[\s\D]/g, "");
                        handleFieldChange("phone", raw);
                      }}
                      onBlur={handlePhoneBlur}
                      className="flex-1 bg-transparent theme-text-main font-bold text-sm outline-none border-b border-(--primary-color) pb-0.5 tracking-wider min-w-0"
                    />
                  </div>
                ) : (
                  <p className="text-sm font-bold theme-text-main tracking-wider">
                    {formData.phone
                      ? (() => {
                        const digits = formData.phone.replace("+509", "").replace(/\D/g, "");
                        if (digits.length <= 4) return `+509 ${digits}`;
                        return `+509 ${digits.slice(0, 4)} ${digits.slice(4)}`;
                      })()
                      : "---"}
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
            {!isEditing && (
              <ProfileField
                icon={<Globe size={18} />}
                label={t("profile_hub.fields.nationality")}
                value={formData.nationality}
                name="nationality"
                disabled={true}
                isEditing={false}
                onChange={handleFieldChange}
              />
            )}
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
            {!isEditing && (
              <ProfileField
                icon={<Clock size={18} />}
                label={t("profile_hub.fields.timezone")}
                value={formData.timezone}
                name="timezone"
                disabled={true}
                isEditing={false}
                onChange={handleFieldChange}
              />
            )}
          </ProfileSection>

          {!isEditing && (
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
                <div className="w-10 h-10 rounded-xl theme-bubble-bg flex items-center justify-center shrink-0">
                  <LogOut size={18} />
                </div>
                <span className="text-sm font-bold">
                  {t("profile_hub.logout_btn")}
                </span>
              </button>
            </ProfileSection>
          )}
        </div>
      </div>

      {/* Modal crop d'image */}
      {showCropModal && rawImageSrc && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="w-full max-w-sm theme-card-bg rounded-4xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black theme-text-main">
                {t("profile_hub.crop_title")}
              </h3>
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setRawImageSrc(null);
                  resetCropPosition();
                }}
                className="p-2 theme-bubble-bg rounded-full theme-text-secondary active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            <div
              ref={imageContainerRef}
              className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-(--primary-color) shadow-xl bg-gray-900"
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <div className="absolute inset-0 rounded-full pointer-events-none z-10 border-2 border-white/30 shadow-inner" />
              <img
                src={rawImageSrc}
                alt="crop preview"
                className="absolute w-full h-full object-cover select-none crop-image"
                style={{
                  transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${cropScale})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
                onLoad={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  setCropImg(img);
                  const containerSize = 256;
                  const imgSize = Math.min(img.naturalWidth, img.naturalHeight);
                  const fillScale = containerSize / imgSize;
                  const minScaleValue = fillScale;
                  const initialScale = fillScale * 1.1;
                  setMinScale(minScaleValue);
                  setMaxScale(Math.max(minScaleValue * 3, 2.5));
                  setCropScale(initialScale);
                  setCropPosition({ x: 0, y: 0 });
                }}
                draggable={false}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <button onClick={() => handleZoom(-0.1)} className="w-8 h-8 theme-bubble-bg rounded-full flex items-center justify-center theme-text-secondary active:scale-90 transition-all">
                  <span className="text-lg font-bold">−</span>
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={((cropScale - minScale) / (maxScale - minScale)) * 100}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-(--primary-color)"
                />
                <button onClick={() => handleZoom(0.1)} className="w-8 h-8 theme-bubble-bg rounded-full flex items-center justify-center theme-text-secondary active:scale-90 transition-all">
                  <span className="text-lg font-bold">+</span>
                </button>
              </div>
              <p className="text-[9px] theme-text-secondary text-center">{t("profile_hub.crop_hint")}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={resetCropPosition} className="px-4 py-3 theme-bubble-bg theme-text-secondary rounded-2xl font-bold text-sm border theme-border active:scale-95 transition-all">
                {t("common.reset")}
              </button>
              <button onClick={() => { setShowCropModal(false); setRawImageSrc(null); resetCropPosition(); }} className="flex-1 py-3 theme-bubble-bg theme-text-secondary rounded-2xl font-bold text-sm border theme-border active:scale-95">
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  if (cropImg && imageContainerRef.current) {
                    const canvas = cropCanvasRef.current;
                    if (!canvas) return;
                    const size = 256;
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    const imageElement = document.querySelector('.crop-image') as HTMLImageElement;
                    if (!imageElement) return;

                    // Récupérer la position réelle de l'image dans le DOM
                    const imageRect = imageElement.getBoundingClientRect();
                    const containerRect = imageContainerRef.current.getBoundingClientRect();

                    // Calculer la zone visible du cercle/carré (c'est un carré 256x256 au centre)
                    const visibleLeft = containerRect.left;
                    const visibleTop = containerRect.top;
                    const visibleRight = containerRect.right;
                    const visibleBottom = containerRect.bottom;

                    // Calculer les proportions et la région source
                    const scaleX = cropImg.naturalWidth / imageRect.width;
                    const scaleY = cropImg.naturalHeight / imageRect.height;

                    const sx = (visibleLeft - imageRect.left) * scaleX;
                    const sy = (visibleTop - imageRect.top) * scaleY;
                    const sWidth = (visibleRight - visibleLeft) * scaleX;
                    const sHeight = (visibleBottom - visibleTop) * scaleY;

                    // Vérifier les limites
                    const clampedSx = Math.max(0, Math.min(sx, cropImg.naturalWidth - sWidth));
                    const clampedSy = Math.max(0, Math.min(sy, cropImg.naturalHeight - sHeight));
                    const clampedWidth = Math.min(sWidth, cropImg.naturalWidth - clampedSx);
                    const clampedHeight = Math.min(sHeight, cropImg.naturalHeight - clampedSy);

                    if (clampedWidth <= 0 || clampedHeight <= 0) return;

                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, size, size);

                    ctx.drawImage(
                      cropImg,
                      clampedSx, clampedSy, clampedWidth, clampedHeight,
                      0, 0, size, size
                    );

                    const croppedUrl = canvas.toDataURL("image/jpeg", 0.92);
                    setFormData((prev) => ({ ...prev, avatarUrl: croppedUrl }));
                  }
                  setShowCropModal(false);
                  setRawImageSrc(null);
                  resetCropPosition();
                }}
                className="flex-1 py-3 theme-primary-bg text-white rounded-2xl font-bold text-sm shadow-lg active:scale-95"
              >
                {t("profile_hub.apply")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <Modal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)}>
        <div className="p-8 space-y-6">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center text-red-500 mx-auto">
            <LogOut size={32} />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black theme-text-main">{t("settings.logout_confirm_title")}</h2>
            <p className="text-sm theme-text-secondary">{t("settings.logout_confirm_desc")}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 p-4 rounded-2xl theme-bubble-bg theme-text-main font-bold active:scale-95 transition-all">
              {t("common.cancel")}
            </button>
            <button onClick={async () => { setShowLogoutConfirm(false); await api.logoutAllSessions(); onLogout(); }} className="flex-1 p-4 rounded-2xl bg-red-500 text-white font-bold active:scale-95 transition-all shadow-lg shadow-red-500/20">
              {t("settings.logout")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Exit Without Saving Modal */}
      <Modal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} type="centered">
        <div className="p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/10 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black theme-text-main tracking-tight">Modifications non sauvegardées</h3>
            <p className="text-sm theme-text-secondary">Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter sans sauvegarder ?</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setShowExitConfirm(false); if (pendingExitAction) pendingExitAction(); setPendingExitAction(null); }}
              className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg"
            >
              Quitter sans sauvegarder
            </button>
            <button onClick={() => { setShowExitConfirm(false); setPendingExitAction(null); }} className="w-full py-4 theme-primary-bg text-white rounded-2xl font-bold active:scale-95 transition-all">
              Rester
            </button>
          </div>
        </div>
      </Modal>

      {/* Avatar Action Menu Modal */}
      <Modal isOpen={showAvatarMenu} onClose={() => setShowAvatarMenu(false)} type="bottom-sheet">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b theme-border">
            <Camera size={20} className="theme-primary-text" />
            <h3 className="text-lg font-bold theme-text-main">Modifier la photo</h3>
          </div>

          {/* Appareil photo */}
          <button
            onClick={() => {
              setShowAvatarMenu(false);
              setTimeout(() => handleCameraCapture(), 100);
            }}
            className="w-full flex items-center gap-4 p-4 theme-bubble-bg rounded-2xl border theme-border active:scale-95 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <Camera size={20} className="text-green-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold theme-text-main">Appareil photo</p>
              <p className="text-[10px] theme-text-secondary">Prendre une photo maintenant</p>
            </div>
            <ChevronRight size={16} className="theme-text-secondary" />
          </button>

          {/* Galerie */}
          <button
            onClick={() => {
              setShowAvatarMenu(false);
              setTimeout(() => fileInputRef.current?.click(), 100);
            }}
            className="w-full flex items-center gap-4 p-4 theme-bubble-bg rounded-2xl border theme-border active:scale-95 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="2.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold theme-text-main">Galerie</p>
              <p className="text-[10px] theme-text-secondary">Choisir une image depuis vos albums</p>
            </div>
            <ChevronRight size={16} className="theme-text-secondary" />
          </button>

          {/* Recadrer la photo actuelle (uniquement si une photo existe) */}
          {formData.avatarUrl && (
            <button
              onClick={() => {
                setShowAvatarMenu(false);
                setRawImageSrc(formData.avatarUrl);
                setShowCropModal(true);
              }}
              className="w-full flex items-center gap-4 p-4 theme-bubble-bg rounded-2xl border theme-border active:scale-95 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Edit2 size={20} className="text-purple-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold theme-text-main">Recadrer la photo actuelle</p>
                <p className="text-[10px] theme-text-secondary">Ajuster le cadrage de votre photo</p>
              </div>
              <ChevronRight size={16} className="theme-text-secondary" />
            </button>
          )}

          {/* Supprimer la photo (toujours visible si une photo existe) */}
          {formData.avatarUrl && (
            <button
              onClick={() => {
                setShowAvatarMenu(false);
                setFormData((prev) => ({ ...prev, avatarUrl: "" }));
                showToast("Photo supprimée", "success");
              }}
              className="w-full flex items-center gap-4 p-4 theme-bubble-bg rounded-2xl border theme-border active:scale-95 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-red-500">Supprimer la photo</p>
                <p className="text-[10px] theme-text-secondary">Revenir aux initiales</p>
              </div>
              <ChevronRight size={16} className="text-red-500/50" />
            </button>
          )}

          <button
            onClick={() => setShowAvatarMenu(false)}
            className="w-full py-4 theme-bubble-bg theme-text-secondary rounded-2xl font-bold text-sm active:scale-95 transition-all"
          >
            Annuler
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;

