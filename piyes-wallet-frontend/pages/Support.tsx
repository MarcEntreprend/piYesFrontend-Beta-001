import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  Headphones,
} from "lucide-react";
import { useTranslation } from "../App";
import PageHeader from "../components/PageHeader";

const Support: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="theme-card-bg min-h-screen flex flex-col animate-in slide-in-from-bottom duration-500">
      <PageHeader
        title={t("support.title")}
        onBack={() => navigate(-1)}
        className="sticky top-0 theme-card-bg z-10 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
      />

      <div className="p-6 space-y-10 flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 theme-bubble-bg rounded-3xl flex items-center justify-center theme-primary-text mb-4 shadow-inner">
          <Headphones size={40} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold theme-text-main">
            {t("support.need_help")}
          </h2>
          <p className="theme-text-secondary text-sm max-w-xs mx-auto">
            {t("support.sub")}
          </p>
        </div>

        <div className="w-full space-y-3">
          <button className="w-full flex items-center gap-4 p-5 theme-bubble-bg rounded-2xl border theme-border hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all active:scale-95">
            <MessageSquare className="theme-primary-text" size={24} />
            <div className="text-left">
              <p className="font-bold theme-text-main text-sm">
                {t("support.chat.label")}
              </p>
              <p className="text-[10px] theme-text-secondary">
                {t("support.chat.sub")}
              </p>
            </div>
          </button>

          <button className="w-full flex items-center gap-4 p-5 theme-bubble-bg rounded-2xl border theme-border hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all active:scale-95">
            <Phone className="theme-text-secondary" size={24} />
            <div className="text-left">
              <p className="font-bold theme-text-main text-sm">
                {t("support.call.label")}
              </p>
              <p className="text-[10px] theme-text-secondary">
                {" "}
                {t("support.call.sub")}
              </p>
            </div>
          </button>

          <button className="w-full flex items-center gap-4 p-5 theme-bubble-bg rounded-2xl border theme-border hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all active:scale-95">
            <Mail className="theme-text-secondary" size={24} />
            <div className="text-left">
              <p className="font-bold theme-text-main text-sm">
                {t("support.email.label")}
              </p>
              <p className="text-[10px] theme-text-secondary">
                {t("support.email.sub")}
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold theme-text-secondary uppercase tracking-widest opacity-60">
          <Clock size={12} /> {t("support.availability")}
        </div>
      </div>
    </div>
  );
};

export default Support;
