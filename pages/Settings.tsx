import React, { useState, useEffect, useMemo } from "react";
/* Use react-router core for hooks */
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  User as UserIcon,
  Shield,
  LogOut,
  ChevronRight,
  HelpCircle,
  Palette,
  Check,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Bell,
  Globe,
  Headphones,
  MessageSquare,
  Info,
  FileText,
  CalendarDays,
  X,
  Type,
  Loader2,
} from "lucide-react";
import { useTranslation } from "../App";
import { Language } from "../translations";
import { User } from "../shared/types";
import Modal from "../components/Modal";
import { api } from "../services/apiService";
import { cacheService } from "../services/cacheService";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";

interface SettingsProps {
  user: User;
  currentTheme: string;
  currentFontSize: string;
  onThemeChange: (theme: string) => void;
  onFontSizeChange: (size: string) => void;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  user,
  currentTheme,
  currentFontSize,
  onThemeChange,
  onFontSizeChange,
  onLogout,
}) => {
  const { language, setLanguage, t } = useTranslation();
  const navigate = useNavigate();
  const { search: urlSearch } = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(urlSearch),
    [urlSearch],
  );

  const [showThemes, setShowThemes] = useState(false);
  const [showFontSizes, setShowFontSizes] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const themes = [
    { id: "default", label: t("settings.themes.default"), color: "#830AD1" },
    { id: "dark", label: t("settings.themes.dark"), color: "#1C1C1C" },
    {
      id: "bleu_cendre",
      label: t("settings.themes.bleu_cendre"),
      color: "#24A1DE",
    },
  ];

  const fontSizes = [
    { id: "small", label: t("settings.font_sizes.small") },
    { id: "default", label: t("settings.font_sizes.default") },
    { id: "large", label: t("settings.font_sizes.large") },
    { id: "extra-large", label: t("settings.font_sizes.extra_large") },
  ];

  const languages = [
    {
      id: "ht",
      label: "Kreyòl Ayisyen",
      code: "HT",
      flag: "https://flagcdn.com/w80/ht.png",
    },
    {
      id: "fr",
      label: "Français",
      code: "FR",
      flag: "https://flagcdn.com/w80/fr.png",
    },
    {
      id: "en",
      label: "English",
      code: "US",
      flag: "https://flagcdn.com/w80/us.png",
    },
  ];

  // Logic to handle highlighting of search results and reset event
  useEffect(() => {
    const scrollTo = searchParams.get("scroll");
    if (scrollTo) {
      setTimeout(() => {
        const el = document.getElementById(scrollTo);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add(
            "ring-4",
            "ring-[var(--primary-color)]",
            "ring-opacity-20",
            "rounded-2xl",
            "transition-all",
            "duration-500",
          );
          setTimeout(
            () => el.classList.remove("ring-4", "ring-opacity-20"),
            3000,
          );
        }
      }, 300);
    }

    const handleReset = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("piyes:reset_settings", handleReset);
    return () =>
      window.removeEventListener("piyes:reset_settings", handleReset);
  }, [searchParams]);

  const SettingItem = ({
    icon,
    label,
    sublabel,
    onClick,
    rightElement,
    id,
  }: any) => (
    <button
      id={id}
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:theme-bubble-bg transition-all active:scale-[0.98] group rounded-2xl"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="text-left">
          <p className="font-bold theme-text-main text-sm">{label}</p>
          {sublabel && (
            <p className="text-[10px] theme-text-secondary">{sublabel}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {rightElement}
        <ChevronRight size={16} className="theme-text-secondary opacity-30" />
      </div>
    </button>
  );

  const SectionTitle = ({ children }: { children?: React.ReactNode }) => (
    <h3 className="px-6 text-[11px] font-bold theme-text-secondary uppercase tracking-[0.15em] mb-2 mt-6">
      {children}
    </h3>
  );

  return (
    <div className="theme-card-bg min-h-screen pb-32">
      <PageHeader title={t("settings.title")} />

      {/* Profile Header */}
      <div
        id="profile-main"
        onClick={() => navigate("/profile")}
        className="px-6 py-8 flex items-center justify-between border-b theme-border hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 theme-bubble-bg rounded-full flex items-center justify-center font-black theme-primary-text text-2xl border-2 border-(--primary-color) shadow-sm group-active:scale-95 transition-transform overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
            )}
          </div>
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold theme-text-main group-hover:theme-primary-text transition-colors">
              {user.name}
            </h2>
            <p className="text-xs font-bold theme-primary-text">
              {user.tag || "@piyes.user"}
            </p>
            <p className="text-[10px] theme-text-secondary font-bold uppercase tracking-widest">
              {t("profile_hub.account_number")} {user.accountNumber}
            </p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full theme-bubble-bg flex items-center justify-center theme-primary-text opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <ChevronRight size={20} />
        </div>
      </div>

      <div className="animate-in fade-in duration-500">
        <SectionTitle>{t("settings.account_section")}</SectionTitle>
        <div className="px-2">
          <SettingItem
            id="set-profile"
            icon={<UserIcon size={20} />}
            label={t("settings.items.profile.label")}
            sublabel={t("settings.items.profile.sub")}
            onClick={() => navigate("/profile")}
          />
          <SettingItem
            id="set-security"
            icon={<ShieldCheck size={20} />}
            label={t("settings.items.security.label")}
            sublabel={t("settings.items.security.sub")}
            onClick={() => navigate("/security")}
          />
          <SettingItem
            id="set-notifications"
            icon={<Bell size={20} />}
            label={t("settings.items.notifications.label")}
            sublabel={t("settings.items.notifications.sub")}
            onClick={() => navigate("/notifications")}
          />
          <SettingItem
            id="set-privacy"
            icon={<Shield size={20} />}
            label="Confidentialité des contacts & transferts"
            sublabel="Gérez qui peut vous trouver et interagir avec vous"
            onClick={() => navigate("/privacy-settings")}
          />
        </div>

        <SectionTitle>{t("settings.pref_section")}</SectionTitle>
        <div className="px-2">
          <SettingItem
            id="set-lang"
            icon={<Globe size={20} />}
            label={t("settings.language")}
            rightElement={
              <span className="text-xs font-bold theme-primary-text">
                {languages.find((l) => l.id === language)?.label}
              </span>
            }
            onClick={() => setShowLanguageModal(true)}
          />
          <div className="w-full" id="set-theme">
            <button
              onClick={() => {
                setShowThemes(!showThemes);
                setShowFontSizes(false);
              }}
              className="w-full flex items-center justify-between p-4 hover:theme-bubble-bg transition-all group rounded-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text">
                  <Palette size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold theme-text-main text-sm">
                    {t("settings.theme")}
                  </p>
                  <p className="text-[10px] theme-text-secondary capitalize">
                    {themes.find((th) => th.id === currentTheme)?.label ||
                      currentTheme}
                  </p>
                </div>
              </div>
              <ChevronRight
                size={16}
                className={`theme-text-secondary transition-transform duration-300 ${showThemes ? "rotate-90" : "opacity-30"}`}
              />
            </button>

            {showThemes && (
              <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top duration-300 theme-card-bg rounded-2xl">
                {themes.map((t_theme) => (
                  <button
                    key={t_theme.id}
                    onClick={() => onThemeChange(t_theme.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                      currentTheme === t_theme.id
                        ? "border-(--primary-color) bg-(--bubble-bg)"
                        : "theme-border bg-transparent opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: t_theme.color }}
                      ></div>
                      <span className="text-xs font-bold theme-text-main">
                        {t_theme.label}
                      </span>
                    </div>
                    {currentTheme === t_theme.id && (
                      <Check size={14} className="theme-primary-text" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-full" id="set-font-size">
            <button
              onClick={() => {
                setShowFontSizes(!showFontSizes);
                setShowThemes(false);
              }}
              className="w-full flex items-center justify-between p-4 hover:theme-bubble-bg transition-all group rounded-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text">
                  <Type size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold theme-text-main text-sm">
                    {t("settings.font_size")}
                  </p>
                  <p className="text-[10px] theme-text-secondary capitalize">
                    {fontSizes.find((s) => s.id === currentFontSize)?.label ||
                      currentFontSize}
                  </p>
                </div>
              </div>
              <ChevronRight
                size={16}
                className={`theme-text-secondary transition-transform duration-300 ${showFontSizes ? "rotate-90" : "opacity-30"}`}
              />
            </button>

            {showFontSizes && (
              <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top duration-300 theme-card-bg rounded-2xl">
                {fontSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => onFontSizeChange(size.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                      currentFontSize === size.id
                        ? "border-(--primary-color) bg-(--bubble-bg)"
                        : "theme-border bg-transparent opacity-60"
                    }`}
                  >
                    <span className="text-xs font-bold theme-text-main">
                      {size.label}
                    </span>
                    {currentFontSize === size.id && (
                      <Check size={14} className="theme-primary-text" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <SettingItem
            id="set-verify"
            icon={<Search size={20} />}
            label={t("settings.items.verify_receipt.label")}
            sublabel={t("settings.items.verify_receipt.sub")}
            onClick={() => navigate("/verification")}
          />
          <SettingItem
            id="set-refresh-assets"
            icon={
              <Loader2 size={20} className={loading ? "animate-spin" : ""} />
            }
            label={t("settings.items.refresh_assets.label")}
            sublabel={t("settings.items.refresh_assets.sub")}
            onClick={async () => {
              setLoading(true);
              // In a real app, we'd pass the list of asset URLs to refresh
              // For now, we'll refresh the known static assets
              const assetsToRefresh = [
                "https://flagcdn.com/w80/ht.png",
                "https://flagcdn.com/w80/fr.png",
                "https://flagcdn.com/w80/us.png",
              ];
              await cacheService.refreshAssets(assetsToRefresh);
              setLoading(false);
            }}
          />
        </div>

        <SectionTitle>{t("settings.support_section")}</SectionTitle>
        <div className="px-2">
          <SettingItem
            id="set-help"
            icon={<HelpCircle size={20} />}
            label={t("settings.items.help.label")}
            sublabel={t("settings.items.help.sub")}
            onClick={() => navigate("/help")}
          />
          <SettingItem
            id="set-support"
            icon={<Headphones size={20} />}
            label={t("settings.items.contact.label")}
            sublabel={t("settings.items.contact.sub")}
            onClick={() => navigate("/support")}
          />
        </div>

        <SectionTitle>{t("settings.info_section")}</SectionTitle>
        <div className="px-2">
          <SettingItem
            id="set-about"
            icon={<Info size={20} />}
            label={t("settings.items.about.label")}
            sublabel={t("settings.items.about.sub")}
            onClick={() => navigate("/about")}
          />
          <SettingItem
            id="set-terms"
            icon={<FileText size={20} />}
            label={t("settings.items.terms.label")}
            sublabel={t("settings.items.terms.sub")}
            onClick={() => navigate("/terms")}
          />
        </div>

        <div className="p-8 space-y-4">
          <Button
            id="set-logout"
            variant="danger"
            fullWidth
            leftIcon={<LogOut size={20} />}
            onClick={() => setShowLogoutConfirm(true)}
          >
            {t("settings.logout")}
          </Button>

          <Button
            id="set-logout-all"
            variant="utility"
            fullWidth
            leftIcon={<Shield size={20} />}
            onClick={() => setShowLogoutAllConfirm(true)}
          >
            {t("settings.logout_all")}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      >
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-2xl font-black theme-text-main">
                {t("settings.language_modal_title")}
              </h2>
              <p className="text-[10px] theme-text-secondary font-bold uppercase tracking-widest">
                {t("settings.language_modal_sub")}
              </p>
            </div>
            <button
              onClick={() => setShowLanguageModal(false)}
              className="p-2 theme-bubble-bg rounded-full theme-text-secondary"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3 pb-6">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => {
                  setLanguage(lang.id as Language);
                  setShowLanguageModal(false);
                }}
                className={`w-full flex items-center justify-between p-5 rounded-full border transition-all active:scale-[0.98] ${language === lang.id ? "theme-primary-bg text-white border-transparent shadow-lg" : "theme-bubble-bg theme-text-main theme-border"}`}
              >
                <div className="flex items-center gap-5">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${language === lang.id ? "bg-white/20" : "bg-white shadow-sm"}`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-100 shrink-0">
                      <img
                        src={lang.flag}
                        alt={lang.code}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span
                      className={`text-[11px] font-black tracking-tight ${language === lang.id ? "text-white" : "text-gray-900"}`}
                    >
                      {lang.code}
                    </span>
                  </div>
                  <span className="font-bold text-sm">{lang.label}</span>
                </div>
                {language === lang.id && <Check size={20} />}
              </button>
            ))}
          </div>
        </div>
      </Modal>

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
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowLogoutConfirm(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                setShowLogoutConfirm(false);
                onLogout();
              }}
            >
              {t("settings.logout")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Logout All Confirmation Modal */}
      <Modal
        isOpen={showLogoutAllConfirm}
        onClose={() => setShowLogoutAllConfirm(false)}
      >
        <div className="p-8 space-y-6">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center text-red-500 mx-auto">
            <Shield size={32} />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black theme-text-main">
              {t("settings.logout_all_confirm_title")}
            </h2>
            <p className="text-sm theme-text-secondary">
              {t("settings.logout_all_confirm_desc")}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowLogoutAllConfirm(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={async () => {
                setShowLogoutAllConfirm(false);
                await api.logoutAllSessions();
                onLogout();
              }}
            >
              {t("settings.logout_all")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
