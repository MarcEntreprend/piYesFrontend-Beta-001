import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Package,
  MessageSquare,
  CreditCard,
  TrendingUp,
  Eye,
  ShoppingCart,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useTranslation } from "../App";
import PageHeader from "../components/PageHeader";
import { motion } from "motion/react";

const MarketplaceDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<
    "overview" | "ads" | "payments"
  >("overview");

  const stats = [
    {
      label: t("boutique.dashboard.views"),
      value: "1,240",
      icon: <Eye size={20} />,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: t("boutique.dashboard.sales"),
      value: "12",
      icon: <ShoppingCart size={20} />,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: t("boutique.dashboard.stats"),
      value: "+15%",
      icon: <TrendingUp size={20} />,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  const myAds = [
    {
      id: "ad1",
      title: "iPhone 15 Pro Max",
      price: 185000,
      status: "active",
      views: 450,
      messages: 8,
      image:
        "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200&h=200&fit=crop",
    },
    {
      id: "ad2",
      title: "Honda Fit 2018",
      price: 1350000,
      status: "active",
      views: 210,
      messages: 3,
      image:
        "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=200&h=200&fit=crop",
    },
  ];

  const recentPayments = [
    {
      id: "p1",
      item: "iPhone 15 Pro Max",
      amount: 185000,
      date: "12 Mars 2025",
      status: "completed",
      buyer: "Jean Dupont",
    },
    {
      id: "p2",
      item: "MacBook Air M2",
      amount: 120000,
      date: "10 Mars 2025",
      status: "completed",
      buyer: "Marie Claire",
    },
  ];

  return (
    <div className="theme-card-bg min-h-screen pb-32 flex flex-col">
      <PageHeader
        title={t("boutique.dashboard.title")}
        onBack={() => navigate("/services")}
      />

      <main className="flex-1 p-6 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${stat.bg} p-4 rounded-3xl border theme-border flex flex-col items-center gap-2 text-center`}
            >
              <div className={stat.color}>{stat.icon}</div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold theme-text-main">
                  {stat.value}
                </p>
                <p className="text-[8px] font-black theme-text-secondary uppercase tracking-tighter">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 theme-bubble-bg rounded-full border theme-border">
          <button
            onClick={() => setActiveSection("overview")}
            className={`flex-1 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === "overview" ? "theme-primary-bg text-white shadow-md" : "theme-text-secondary"}`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveSection("ads")}
            className={`flex-1 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === "ads" ? "theme-primary-bg text-white shadow-md" : "theme-text-secondary"}`}
          >
            {t("boutique.dashboard.manage_posts")}
          </button>
          <button
            onClick={() => setActiveSection("payments")}
            className={`flex-1 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === "payments" ? "theme-primary-bg text-white shadow-md" : "theme-text-secondary"}`}
          >
            {t("boutique.dashboard.payments")}
          </button>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {activeSection === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Recent Activity */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[11px] font-black theme-text-secondary uppercase tracking-[0.2em]">
                    Activité récente
                  </h3>
                  <button className="text-[10px] font-bold theme-primary-text">
                    Voir tout
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="p-4 theme-bubble-bg border theme-border rounded-3xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                      <MessageSquare size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold theme-text-main">
                        Nouveau message pour "iPhone 15"
                      </p>
                      <p className="text-[10px] theme-text-secondary">
                        Il y a 5 minutes
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="theme-text-secondary opacity-30"
                    />
                  </div>
                  <div className="p-4 theme-bubble-bg border theme-border rounded-3xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                      <CreditCard size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold theme-text-main">
                        Paiement reçu : 185,000 G.
                      </p>
                      <p className="text-[10px] theme-text-secondary">
                        Il y a 2 heures
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="theme-text-secondary opacity-30"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigate("/services?tab=my_ads")}
                  className="p-6 theme-card-bg border theme-border rounded-4xl flex flex-col items-center gap-3 shadow-sm active:scale-95 transition-all"
                >
                  <div className="p-3 theme-bubble-bg rounded-2xl theme-primary-text">
                    <Plus size={24} />
                  </div>
                  <span className="text-[10px] font-black theme-text-main uppercase tracking-widest text-center">
                    Nouvelle annonce
                  </span>
                </button>
                <button className="p-6 theme-card-bg border theme-border rounded-4xl flex flex-col items-center gap-3 shadow-sm active:scale-95 transition-all">
                  <div className="p-3 theme-bubble-bg rounded-2xl theme-primary-text">
                    <ExternalLink size={24} />
                  </div>
                  <span className="text-[10px] font-black theme-text-main uppercase tracking-widest text-center">
                    Partager boutique
                  </span>
                </button>
              </div>
            </div>
          )}

          {activeSection === "ads" && (
            <div className="space-y-4 animate-in slide-in-from-right duration-500">
              {myAds.map((ad) => (
                <div
                  key={ad.id}
                  className="p-4 theme-card-bg border theme-border rounded-4xl flex items-center gap-4 shadow-sm"
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border theme-border shrink-0">
                    <img
                      src={ad.image}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold theme-text-main text-sm truncate">
                      {ad.title}
                    </h4>
                    <p className="theme-primary-text font-black text-sm">
                      {ad.price.toLocaleString("fr-HT")} G.
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-bold theme-text-secondary flex items-center gap-1">
                        <Eye size={10} /> {ad.views}
                      </span>
                      <span className="text-[9px] font-bold theme-text-secondary flex items-center gap-1">
                        <MessageSquare size={10} /> {ad.messages}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 theme-bubble-bg rounded-full theme-text-secondary active:scale-90 transition-transform">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-2 theme-bubble-bg rounded-full text-red-500 active:scale-90 transition-transform">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate("/services?tab=my_ads")}
                className="w-full py-4 theme-bubble-bg border border-dashed theme-border rounded-3xl text-[10px] font-black theme-text-secondary uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Ajouter une annonce
              </button>
            </div>
          )}

          {activeSection === "payments" && (
            <div className="space-y-4 animate-in slide-in-from-right duration-500">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-5 theme-card-bg border theme-border rounded-4xl space-y-3 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                        {payment.date}
                      </p>
                      <h4 className="font-bold theme-text-main text-sm">
                        {payment.item}
                      </h4>
                    </div>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                      Complété
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-t theme-border pt-3">
                    <div>
                      <p className="text-[9px] theme-text-secondary font-bold uppercase">
                        Acheteur
                      </p>
                      <p className="text-xs font-bold theme-text-main">
                        {payment.buyer}
                      </p>
                    </div>
                    <p className="theme-primary-text font-black text-base">
                      {payment.amount.toLocaleString("fr-HT")} G.
                    </p>
                  </div>
                </div>
              ))}
              {recentPayments.length === 0 && (
                <div className="py-20 text-center opacity-30 italic text-sm">
                  Aucun paiement reçu pour le moment.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MarketplaceDashboard;
