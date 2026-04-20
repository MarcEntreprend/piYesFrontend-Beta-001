import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Shield,
  Rocket,
  Gem,
  HelpCircle,
  Star,
  Sparkles,
  Info,
} from "lucide-react";
import { useTranslation, useSecurity, useToast } from "../App";
import PageHeader from "../components/PageHeader";

interface Plan {
  id: string;
  name: string;
  price: number;
  estimatedValue: number;
  color: string;
  tagline: string;
  perksKey: string;
  icon: React.ReactNode;
  popular?: boolean;
}

const Plans: React.FC = () => {
  const { t } = useTranslation();
  const { triggerSensitiveAction } = useSecurity();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("basic");

  const plans: Plan[] = [
    {
      id: "basic",
      name: "Basic",
      price: 0,
      estimatedValue: 500,
      color: "#10B981", // Emerald-500
      tagline: t("plans.tagline_basic"),
      perksKey: "plans.perks.basic",
      icon: <Star size={24} />,
    },
    {
      id: "low",
      name: "Low",
      price: 500,
      estimatedValue: 1500,
      color: "#3B82F6", // Blue-500
      tagline: t("plans.tagline_low"),
      perksKey: "plans.perks.low",
      icon: <Rocket size={24} />,
    },
    {
      id: "mid",
      name: "Mid",
      price: 1500,
      estimatedValue: 3500,
      color: "#830AD1", // piYès Purple
      tagline: t("plans.tagline_mid"),
      perksKey: "plans.perks.mid",
      popular: true,
      icon: <Shield size={24} />,
    },
    {
      id: "high",
      name: "High",
      price: 3500,
      estimatedValue: 8000,
      color: "#EF4444", // Red-500
      tagline: t("plans.tagline_high"),
      perksKey: "plans.perks.high",
      icon: <Gem size={24} />,
    },
  ];

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === "basic") {
      showToast(t("plans.toast_basic_default"));
      return;
    }

    triggerSensitiveAction(() => {
      // En prod: appel API vers /subscriptions/subscribe
      showToast(
        t("plans.toast_subscribe_sent", { name: plan.name }),
        "success",
      );
      navigate("/");
    });
  };

  return (
    <div className="theme-card-bg min-h-screen flex flex-col pb-12 animate-in fade-in duration-500">
      <PageHeader
        title={t("plans.title")}
        onBack={() => navigate(-1)}
        rightElement={
          <button className="theme-text-secondary">
            <HelpCircle size={22} />
          </button>
        }
        className="sticky top-0 theme-card-bg z-30 shadow-sm hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
      />

      <main className="flex-1 p-6 space-y-10 overflow-y-auto no-scrollbar">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="theme-primary-text" />
            <span className="text-[10px] font-black theme-primary-text uppercase tracking-widest">
              {t("plans.exclusive_offers")}
            </span>
          </div>
          <h2 className="text-2xl font-black theme-text-main leading-tight">
            {t("plans.subtitle")}
          </h2>
        </div>

        <div className="space-y-6">
          {plans.map((plan) => {
            const perks = t(plan.perksKey);
            const perksArray = Array.isArray(perks) ? perks : [];

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`p-6 rounded-[40px] border-2 transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                  selectedPlanId === plan.id
                    ? "theme-bubble-bg border-(--primary-color) shadow-xl"
                    : "theme-card-bg border-transparent grayscale hover:grayscale-0 hover:theme-bubble-bg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-6 bg-[#830AD1] text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                    {t("plans.popular_badge")}
                  </div>
                )}

                <div className="flex gap-5 items-start mb-6">
                  <div
                    className="w-14 h-14 rounded-[22px] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: plan.color }}
                  >
                    {plan.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black theme-text-main tracking-tight">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black theme-primary-text">
                        {plan.price.toLocaleString("fr-HT")} G.
                      </span>
                      <span className="text-[10px] font-bold theme-text-secondary">
                        {t("plans.month")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-3xl border theme-border mb-6">
                  <p className="text-[10px] font-black theme-text-secondary uppercase tracking-[0.1em] italic">
                    {t("plans.estimated_value", {
                      amount: plan.estimatedValue.toLocaleString("fr-HT"),
                    })}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {perksArray.map((perk: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Check
                          size={10}
                          className="text-green-600 dark:text-green-400"
                          strokeWidth={3}
                        />
                      </div>
                      <span className="text-xs font-bold theme-text-secondary leading-tight">
                        {perk}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  <p className="text-[10px] theme-text-secondary italic text-center px-4 leading-relaxed mb-4">
                    "{plan.tagline}"
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(plan);
                    }}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                      selectedPlanId === plan.id
                        ? "theme-primary-bg text-white"
                        : "theme-bubble-bg theme-primary-text border theme-border"
                    }`}
                  >
                    {plan.id === "basic"
                      ? t("plans.active_badge")
                      : t("plans.choose")}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 theme-bubble-bg rounded-4xl border theme-border flex gap-4 items-start shadow-inner">
          <Info size={20} className="theme-primary-text shrink-0 mt-0.5" />
          <p className="text-[10px] theme-primary-text font-medium leading-relaxed italic">
            {t("plans.change_anytime")}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 opacity-30 py-8">
          <Shield size={24} className="theme-text-main" />
          <p className="text-[9px] font-black theme-text-main uppercase tracking-[0.2em]">
            {t("plans.secure_payment")}
          </p>
        </div>
      </main>
    </div>
  );
};

export default Plans;
