import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Globe2,
  ChevronRight,
  Info,
  ShieldCheck,
  Zap,
  Landmark,
  Banknote,
} from "lucide-react";
import { useTranslation } from "../App";
import PageHeader from "../components/PageHeader";

const InternationalProviders: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const providers = [
    {
      id: "piyes",
      name: "piYès International",
      desc: "Transfert instantané vers plus de 50 pays avec les meilleurs taux.",
      icon: <Zap size={24} />,
      color: "theme-primary-bg",
      textColor: "text-white",
      badge: "Recommandé",
      route: "/piyes-international",
    },
    {
      id: "wise",
      name: "Wise",
      desc: "Envoyez de l'argent à l'étranger au taux de change réel.",
      icon: <Globe2 size={24} />,
      color: "bg-[#00B9FF]",
      textColor: "text-white",
      route: "#",
      disabled: true,
    },
    {
      id: "moneygram",
      name: "MoneyGram",
      desc: "Transferts d'argent rapides et fiables dans le monde entier.",
      icon: <Banknote size={24} />,
      color: "bg-[#E10600]",
      textColor: "text-white",
      route: "#",
      disabled: true,
    },
    {
      id: "western-union",
      name: "Western Union",
      desc: "Envoyez de l'argent en ligne ou en personne.",
      icon: <Landmark size={24} />,
      color: "bg-[#FFCC00]",
      textColor: "text-black",
      route: "#",
      disabled: true,
    },
  ];

  return (
    <div className="theme-card-bg min-h-screen flex flex-col animate-in fade-in duration-500 pb-32">
      <PageHeader
        title={t("actions.international")}
        onBack={() => navigate(-1)}
        className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
      />
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-black theme-text-main tracking-tight">
            Choisissez un prestataire
          </h2>
          <p className="text-sm theme-text-secondary">
            Sélectionnez le service qui vous convient le mieux pour votre
            transfert international.
          </p>
        </div>

        <div className="space-y-4">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => !provider.disabled && navigate(provider.route)}
              disabled={provider.disabled}
              className={`w-full p-6 rounded-4xl border theme-border flex items-center gap-5 text-left transition-all relative overflow-hidden group shadow-sm ${provider.disabled ? "opacity-50 grayscale" : "active:scale-[0.98] hover:shadow-md theme-bubble-bg"}`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border theme-border shrink-0 ${provider.color} ${provider.textColor}`}
              >
                {provider.icon}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-black theme-text-main text-sm uppercase tracking-tight">
                    {provider.name}
                  </h4>
                  {provider.badge && (
                    <span className="text-[8px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">
                      {provider.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] theme-text-secondary font-medium leading-relaxed">
                  {provider.desc}
                </p>
                {provider.disabled && (
                  <p className="text-[8px] font-black theme-primary-text uppercase tracking-widest mt-1">
                    Bientôt disponible
                  </p>
                )}
              </div>
              {!provider.disabled && (
                <ChevronRight
                  size={20}
                  className="theme-text-secondary opacity-30 group-hover:opacity-100 transition-opacity"
                />
              )}
            </button>
          ))}
        </div>

        {/* Security Note */}
        <div className="p-6 theme-bubble-bg rounded-4xl border theme-border flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center theme-primary-text shadow-sm shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold theme-text-main">
              Transferts Sécurisés
            </p>
            <p className="text-[10px] theme-text-secondary leading-relaxed">
              Tous nos partenaires sont certifiés et vos fonds sont protégés par
              notre garantie de sécurité piYès.
            </p>
          </div>
        </div>

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
                En savoir plus sur les transferts internationaux
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="theme-text-secondary opacity-30" />
        </button>
      </div>
    </div>
  );
};

export default InternationalProviders;
