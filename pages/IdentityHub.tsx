// pages/IdentityHub.tsx

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Copy,
  Share2,
  QrCode as QrIcon,
  Info,
  ChevronRight,
  User as UserIcon,
  Edit2,
  Save,
  X,
  Camera,
  MapPin,
  Globe,
  Calendar,
  Mail,
  Smartphone,
} from "lucide-react";
import { User, getInitials } from "../shared/types";
import { useTranslation, useToast, SecurityContext } from "../App";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../services/apiService";

interface IdentityHubProps {
  user: User;
  onUpdate?: (updatedUser: User) => void;
}

const IdentityHub: React.FC<IdentityHubProps> = ({ user, onUpdate }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    dob: user.dob || "",
    address: user.address || "",
    nationality: user.nationality || "",
    avatarUrl: user.avatarUrl || "",
  });

  const { triggerSensitiveAction } = React.useContext(SecurityContext);

  const transferUrl = `https://piyes.ht/pay?to=${user.tag?.replace("@", "")}&type=tag`;

  const copyTag = () => {
    if (user.tag) {
      navigator.clipboard.writeText(user.tag);
      showToast(t("common.copied"), "success");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const emailChanged = formData.email !== user.email;
      const phoneChanged = formData.phone !== user.phone;
      let otpCode: string | undefined;

      if (emailChanged || phoneChanged) {
        // triggerSensitiveAction prend une fonction callback, pas 2 arguments
        await new Promise<void>((resolve, reject) => {
          triggerSensitiveAction((pin) => {
            // L'OTP est vérifié via le flow de sécurité existant
            resolve();
          });
        });
      }

      const updatedUser = await api.updateProfile({ ...formData, otpCode });
      if (onUpdate) onUpdate(updatedUser);
      setIsEditing(false);
      showToast(t("profile.save_success"), "success");
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast(t("profile.save_error"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatarUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="theme-card-bg min-h-screen flex flex-col animate-in fade-in duration-500 pb-32">
      <header className="px-6 pt-12 pb-6 border-b theme-border flex items-center justify-between sticky top-0 theme-card-bg z-30">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 theme-text-secondary active:scale-90 transition-transform"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold ml-4 theme-text-main">
            Identity Hub
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 theme-text-secondary active:scale-90 transition-transform"
                disabled={isSaving}
              >
                <X size={24} />
              </button>
              <button
                onClick={handleSave}
                className="p-2 theme-primary-text active:scale-90 transition-transform disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={24} />
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 theme-text-secondary active:scale-90 transition-transform"
            >
              <Edit2 size={24} />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
        {/* Profile Card */}
        <div className="theme-bubble-bg rounded-4xl p-8 border theme-border flex flex-col items-center text-center space-y-4 shadow-sm">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden bg-gray-100">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center theme-primary-text text-2xl font-black">
                  {user.initials || getInitials(formData.name || user.name)}
                </div>
              )}
            </div>
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 theme-primary-text p-2 rounded-full shadow-lg border theme-border active:scale-90 transition-transform"
              >
                <Camera size={16} />
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            {!isEditing && user.verificationStatus === "verified" && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white dark:border-gray-800 shadow-lg">
                <ShieldCheck size={16} />
              </div>
            )}
          </div>

          <div className="space-y-1 w-full">
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full bg-transparent border-b-2 border-purple-500 text-center text-xl font-black theme-text-main focus:outline-none"
                placeholder="Votre nom complet"
              />
            ) : (
              <h2 className="text-xl font-black theme-text-main">
                {user.name}
              </h2>
            )}
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-bold theme-primary-text">
                {user.tag || "@piyes.user"}
              </span>
              {!isEditing && (
                <button
                  onClick={copyTag}
                  className="p-1 theme-text-secondary hover:theme-primary-text transition-colors"
                >
                  <Copy size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* QR Code Section - Only show when  not editing */}
        {!isEditing && (
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold theme-text-secondary uppercase tracking-[0.2em] px-1">
              Votre QR Code Permanent
            </h3>
            <div className="bg-white p-8 rounded-[40px] shadow-xl border theme-border flex flex-col items-center space-y-6">
              <div className="p-4 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <QRCodeSVG
                  value={transferUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "/favicon.ico",
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-bold theme-text-main">
                  Scannez pour me payer
                </p>
                <p className="text-[10px] theme-text-secondary max-w-[200px] mx-auto">
                  Ce QR code est permanent et lié à votre tag{" "}
                  <span className="font-bold theme-primary-text">
                    {user.tag}
                  </span>
                  .
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: "Mon piYès Tag",
                        text: `Payez-moi sur piYès via mon tag: ${user.tag}`,
                        url: transferUrl,
                      });
                    }
                  }}
                  className="flex-1 theme-bubble-bg theme-text-main py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all border theme-border"
                >
                  <Share2 size={16} /> Partager
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Help Link */}
        <button
          onClick={() => navigate("/help")}
          className="w-full p-6 theme-bubble-bg rounded-4xl border theme-border flex items-center justify-between active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center theme-text-secondary shadow-sm">
              <Info size={20} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold theme-text-main">
                Besoin d'aide ?
              </p>
              <p className="text-[10px] theme-text-secondary">
                En savoir plus sur l'identité piYès
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="theme-text-secondary opacity-30" />
        </button>
      </div>
    </div>
  );
};

export default IdentityHub;
