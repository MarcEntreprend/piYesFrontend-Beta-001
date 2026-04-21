// pages\Promotions.tsx

import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Gift,
  Users,
  Star,
  ChevronRight,
  Sparkles,
  Zap,
  Ticket,
  Share2,
} from "lucide-react";
import { useTranslation } from "../App";
import PageHeader from "../components/PageHeader";

const Promotions: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#refer-earn") {
      const element = document.getElementById("refer-earn");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  const activePromos = [
    {
      id: "refer",
      title: t("promos.items.refer.title"),
      description: t("promos.items.refer.desc"),
      icon: <Users className="text-blue-500" />,
      badge: t("promos.items.refer.badge"),
      color: "bg-blue-50",
    },
    {
      id: "refer-earn",
      title: t("promos.items.refer_earn.title"),
      description: t("promos.items.refer_earn.desc"),
      icon: <Share2 className="text-purple-500" />,
      badge: t("promos.items.refer_earn.badge"),
      color: "bg-purple-50",
    },
    {
      id: "welcome",
      title: t("promos.items.welcome.title"),
      description: t("promos.items.welcome.desc"),
      icon: <Sparkles className="text-amber-500" />,
      badge: t("promos.items.welcome.badge"),
      color: "bg-amber-50",
    },
    {
      id: "cashback",
      title: t("promos.items.cashback.title"),
      description: t("promos.items.cashback.desc"),
      icon: <Ticket className="text-green-500" />,
      badge: t("promos.items.cashback.badge"),
      color: "bg-green-50",
    },
  ];

  return (
    <div className="theme-card-bg min-h-screen pb-32 flex flex-col">
      <PageHeader
        title={t("promos.title")}
        onBack={() => navigate(-1)}
        className="sticky top-0 theme-card-bg z-30 shadow-sm hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
      />


      {/* ✅ Contenu scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="mt-12 px-6">
          <button
            onClick={() => navigate("/plans")}
            className="w-full p-6 bg-linear-to-br from-gray-50 to-white dark:from-white/5 dark:to-transparent rounded-4xl border theme-border flex gap-5 items-center text-left group active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 theme-bubble-bg rounded-2xl flex items-center justify-center shrink-0 shadow-sm border theme-border group-hover:scale-110 transition-transform">
              <Users size={24} className="theme-primary-text" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xs font-bold theme-text-main leading-tight">
                {t("promos.club.title")}
              </p>
              <p className="text-[9px] theme-text-secondary leading-relaxed uppercase tracking-wider font-black">
                {t("promos.club.desc")}
              </p>
            </div>
            <ChevronRight size={18} className="theme-text-secondary opacity-30" />
          </button>
        </div>

        <div className="animate-in fade-in duration-500">
          <div className="p-6">
            <div className="theme-primary-bg rounded-4xl p-8 text-white relative overflow-hidden shadow-xl">
              <div className="absolute -right-8 -top-8 opacity-10 rotate-12">
                <Gift size={160} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                  <Zap size={24} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black leading-tight">
                    {t("promos.banner.title")}
                  </h2>
                  <p className="text-xs opacity-80 max-w-50">
                    {t("promos.banner.desc")}
                  </p>
                </div>
                <button className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-xs shadow-lg active:scale-95 transition-all">
                  {t("promos.banner.btn")}
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 space-y-8">
            <section className="space-y-4">
              <h3 className="text-[11px] font-bold theme-text-secondary uppercase tracking-[0.2em]">
                {t("promos.available")}
              </h3>
              <div className="space-y-4">
                {activePromos.map((promo) => (
                  <div
                    key={promo.id}
                    id={promo.id}
                    className={`p-5 rounded-[28px] border theme-border flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer theme-card-bg hover:shadow-md`}
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className={`w-14 h-14 ${promo.color} rounded-2xl flex items-center justify-center shrink-0 border theme-border group-hover:scale-105 transition-transform`}
                      >
                        {promo.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold theme-text-main text-sm">
                            {promo.title}
                          </h4>
                          <span className="text-[8px] font-bold bg-gray-100 theme-text-secondary px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            {promo.badge}
                          </span>
                        </div>
                        <p className="text-[10px] theme-text-secondary leading-relaxed line-clamp-2 max-w-45">
                          {promo.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className="theme-text-secondary opacity-30 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[11px] font-bold theme-text-secondary uppercase tracking-[0.2em]">
                {t("promos.loyalty.title")}
              </h3>
              <div className="p-6 theme-bubble-bg border theme-border rounded-4xl space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Star className="text-amber-500 fill-amber-500" size={20} />
                    <span className="font-bold theme-text-main text-sm">
                      {t("promos.loyalty.points")}
                    </span>
                  </div>
                  <span className="text-xl font-black theme-primary-text">
                    1,250
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full theme-primary-bg w-[60%]"></div>
                  </div>
                  <p className="text-[9px] theme-text-secondary text-center">
                    {t("promos.loyalty.next_tier", { points: 750 })}
                  </p>
                </div>
                <button className="w-full theme-card-bg border theme-border theme-text-main py-3 rounded-2xl text-xs font-bold active:scale-95 transition-all shadow-sm">
                  {t("promos.loyalty.btn")}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Promotions;
