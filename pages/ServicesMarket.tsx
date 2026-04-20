import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  ShoppingBag,
  MessageSquare,
  Bell,
  Package,
  ChevronDown,
  ChevronUp,
  MapPin,
  Star,
  Heart,
  MoreVertical,
  Plus,
  Filter,
  ShieldCheck,
  X,
  Camera,
  ShieldAlert,
  DollarSign,
  Tag,
  Info,
  UserCheck,
  Briefcase,
  Gift,
  User,
  Check,
  RotateCcw,
  Store,
  Globe,
  Sparkles,
  ChevronRight,
  UserCircle,
  LayoutGrid,
  SlidersHorizontal,
} from "lucide-react";
import { Ad, Conversation } from "../shared/types";
import MessagingHub from "./MessagingHub";
import MarketplaceDashboard from "./MarketplaceDashboard";
import { useTranslation } from "../App";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import { messagingService } from "../services/messagingService";
import { motion, AnimatePresence } from "motion/react";

interface FilterableAd extends Ad {
  type: "product" | "service";
  isOffer: boolean;
  serviceCategory: "market" | "national" | "enterprise" | "sme" | "freelance";
}

const ServicesMarket: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Fix: use 'search' directly from useLocation to match usage in searchParams useMemo
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  const [activeTab, setActiveTab] = useState<
    "home" | "my_ads" | "messages" | "dashboard"
  >("home");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isTrendingCollapsed, setIsTrendingCollapsed] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [expandedAdId, setExpandedAdId] = useState<string | null>(null);
  const [adConversations, setAdConversations] = useState<
    Record<string, Conversation[]>
  >({});

  const trendingRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(true);
  const scrollAnimationRef = useRef<number | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab === "home" ||
      tab === "my_ads" ||
      tab === "messages" ||
      tab === "dashboard"
    ) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  useEffect(() => {
    messagingService.getMyAds().then(setMyAds);
  }, []);

  useEffect(() => {
    if (expandedAdId) {
      messagingService.getConversationsForAd(expandedAdId).then((convs) => {
        setAdConversations((prev) => ({ ...prev, [expandedAdId]: convs }));
      });
    }
  }, [expandedAdId]);

  useEffect(() => {
    // Listen for Boutique button second click reset
    const handleReset = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (trendingRef.current) {
        // Reset infinite scroll position to the start of the visible set
        const firstSetWidth = trendingRef.current.scrollWidth / 3;
        trendingRef.current.scrollTo({
          left: firstSetWidth,
          behavior: "smooth",
        });
      }
    };
    window.addEventListener("piyes:reset_services", handleReset);
    return () =>
      window.removeEventListener("piyes:reset_services", handleReset);
  }, []);

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("piyes-favorites");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const toggleFavorite = (e: React.MouseEvent, adId: string) => {
    e.stopPropagation();
    const next = new Set(favorites);
    if (next.has(adId)) next.delete(adId);
    else next.add(adId);
    setFavorites(next);
    localStorage.setItem("piyes-favorites", JSON.stringify(Array.from(next)));
  };

  const [selectedLocation] = useState<string>("Tout Haïti");
  const [activeCategories] = useState<string[]>([]);
  const [onlyOffers] = useState(false);
  const [onlyProducts] = useState(false);
  const [onlyPros] = useState(false);

  const boutiqueTabs = [
    {
      id: "home",
      label: t("boutique.tabs.home"),
      icon: <ShoppingBag size={18} />,
    },
    {
      id: "dashboard",
      label: t("boutique.dashboard.title"),
      icon: <LayoutGrid size={18} />,
    },
    {
      id: "my_ads",
      label: t("boutique.tabs.my_ads"),
      icon: <Package size={18} />,
      badge: "2",
    },
    {
      id: "messages",
      label: t("boutique.tabs.messages"),
      icon: <MessageSquare size={18} />,
      badge: "3",
    },
    {
      id: "notifications",
      label: t("boutique.tabs.notifications"),
      icon: <Bell size={18} />,
      badge: "9+",
    },
  ];

  const ads: FilterableAd[] = useMemo(
    () => [
      {
        id: "ad1",
        title: "iPhone 15 Pro Max",
        description: "État neuf, batterie 100%, 512GB. Facture fournie.",
        price: 185000,
        location: "Pétion-Ville",
        category: "Électronique",
        serviceCategory: "market",
        type: "product",
        isOffer: true,
        images: [
          "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
        ],
        rating: 4.9,
        date: "10 Mars 2025",
        seller: {
          id: "s1",
          name: "Ronald Richards",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ronald",
          acceptsPiyes: true,
          phone: "+509 3744-1122",
        },
        views: 1240,
        messages: 12,
      },
      {
        id: "ad2",
        title: "Honda Fit 2018",
        description: "Très propre, climatisation parfaite, moteur impeccable.",
        price: 1350000,
        location: "Delmas",
        category: "Auto",
        serviceCategory: "market",
        type: "product",
        isOffer: false,
        images: [
          "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&h=400&fit=crop",
        ],
        rating: 4.7,
        date: "Hier",
        seller: {
          id: "s2",
          name: "Marie Pierre",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marie",
          acceptsPiyes: false,
        },
        views: 560,
        messages: 4,
      },
    ],
    [t],
  );

  const infiniteTrendingAds = useMemo(() => [...ads, ...ads, ...ads], [ads]);

  useEffect(() => {
    if (isTrendingCollapsed || activeTab !== "home") {
      if (scrollAnimationRef.current)
        cancelAnimationFrame(scrollAnimationRef.current);
      return;
    }
    const scrollContainer = trendingRef.current;
    if (!scrollContainer) return;
    const animate = () => {
      if (isAutoScrolling.current && scrollContainer) {
        scrollContainer.scrollLeft += 0.5;
        const firstSetWidth = scrollContainer.scrollWidth / 3;
        if (scrollContainer.scrollLeft >= firstSetWidth * 2)
          scrollContainer.scrollLeft = firstSetWidth;
      }
      scrollAnimationRef.current = requestAnimationFrame(animate);
    };
    scrollContainer.scrollLeft = scrollContainer.scrollWidth / 3;
    scrollAnimationRef.current = requestAnimationFrame(animate);
    return () => {
      if (scrollAnimationRef.current)
        cancelAnimationFrame(scrollAnimationRef.current);
    };
  }, [isTrendingCollapsed, activeTab]);

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const matchSearch = ad.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [ads, searchTerm]);

  const categoriesList = [
    { id: "electronics", label: "Électronique", icon: "📱" },
    { id: "vehicles", label: "Véhicules", icon: "🚗" },
    { id: "home", label: "Maison", icon: "🏠" },
    { id: "fashion", label: "Mode", icon: "👕" },
    { id: "services", label: "Services", icon: "🛠️" },
  ];

  return (
    <div className="theme-card-bg min-h-screen pb-32 flex flex-col relative">
      <PageHeader
        title={t("boutique.title")}
        onBack={() => navigate("/")}
        rightElement={
          <button
            onClick={() => navigate("/marketplace/search")}
            className="p-2 theme-bubble-bg rounded-full theme-primary-text active:scale-90 transition-transform"
          >
            <SlidersHorizontal size={20} />
          </button>
        }
      />

      <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 py-4 theme-card-bg border-b theme-border sticky top-18 z-40">
        {boutiqueTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              tab.id === "notifications"
                ? navigate("/notifications")
                : setActiveTab(tab.id as any)
            }
            className={`flex items-center gap-2 px-5 py-3 rounded-full whitespace-nowrap transition-all text-xs font-bold relative ${activeTab === tab.id ? "theme-primary-bg text-white shadow-lg scale-105" : "theme-bubble-bg theme-text-secondary"}`}
          >
            {tab.icon} {tab.label}
            {tab.badge && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 shadow-sm">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        {activeTab === "home" && (
          <div className="animate-in fade-in duration-500">
            <div className="px-6 pt-6 pb-2 space-y-4">
              <div
                onClick={() => navigate("/marketplace/search")}
                className="relative flex-1 group cursor-pointer"
              >
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-secondary opacity-40 group-focus-within:theme-primary-text transition-colors"
                  size={20}
                />
                <div className="w-full theme-bubble-bg py-4 pl-12 pr-4 rounded-3xl theme-text-secondary text-sm border theme-border opacity-70">
                  {t("boutique.search_placeholder")}
                </div>
              </div>
            </div>

            {/* Categories Quick Access */}
            <div className="px-6 py-4">
              <div className="flex gap-4 overflow-x-auto no-scrollbar">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() =>
                      navigate(`/marketplace/search?category=${cat.id}`)
                    }
                    className="flex flex-col items-center gap-2 p-4 min-w-20 theme-bubble-bg rounded-3xl border theme-border active:scale-95 transition-all"
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-[8px] font-black theme-text-main uppercase tracking-widest">
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <section className="py-4 space-y-6">
              <div className="px-6 flex justify-between items-center border-b theme-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="theme-primary-text" />
                  <h3 className="text-xl font-bold theme-text-main">
                    {t("boutique.sections.trending")}
                  </h3>
                </div>
                <button
                  onClick={() => setIsTrendingCollapsed(!isTrendingCollapsed)}
                  className="p-1.5 theme-bubble-bg rounded-full theme-text-secondary transition-transform duration-300"
                  style={{
                    transform: isTrendingCollapsed
                      ? "rotate(-90deg)"
                      : "rotate(0deg)",
                  }}
                >
                  <ChevronDown size={18} />
                </button>
              </div>
              {!isTrendingCollapsed && (
                <div
                  ref={trendingRef}
                  className="flex gap-5 overflow-x-auto no-scrollbar px-6 pb-4"
                >
                  {infiniteTrendingAds.map((ad, idx) => (
                    <div
                      key={`${ad.id}-${idx}`}
                      onClick={() => navigate(`/ad/${ad.id}`)}
                      className="shrink-0 w-44 theme-card-bg rounded-4xl border theme-border overflow-hidden shadow-sm active:scale-[0.98] transition-all group"
                    >
                      <div className="relative aspect-3/4 overflow-hidden">
                        <img
                          src={ad.images[0]}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => toggleFavorite(e, ad.id)}
                          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md border border-white/20 ${favorites.has(ad.id) ? "bg-red-50 text-white" : "bg-black/20 text-white"}`}
                        >
                          <Heart
                            size={16}
                            fill={
                              favorites.has(ad.id) ? "currentColor" : "none"
                            }
                          />
                        </button>
                      </div>
                      <div className="p-4 space-y-2">
                        <h4 className="font-bold theme-text-main text-xs line-clamp-2 h-8">
                          {ad.title}
                        </h4>
                        <p className="theme-primary-text font-black text-sm">
                          {ad.price.toLocaleString("fr-HT")} G.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="px-6 py-6 space-y-6">
              <div className="flex items-center gap-2 border-b theme-border pb-3">
                <Package size={16} className="theme-primary-text" />
                <h3 className="text-xl font-bold theme-text-main">
                  {t("boutique.sections.latest")}
                </h3>
              </div>
              <div className="space-y-4">
                {filteredAds.map((ad) => (
                  <div
                    key={ad.id}
                    onClick={() => navigate(`/ad/${ad.id}`)}
                    className="flex gap-5 p-5 theme-card-bg border theme-border rounded-4xl shadow-sm active:scale-[0.98] transition-all group"
                  >
                    <div className="w-28 h-28 rounded-2xl overflow-hidden shrink-0 border theme-border">
                      <img
                        src={ad.images[0]}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold theme-text-main text-sm">
                          {ad.title}
                        </h4>
                        <div className="flex items-center gap-1.5 opacity-50">
                          <MapPin size={10} />
                          <span className="text-[9px] font-bold uppercase">
                            {ad.location}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="theme-primary-text font-black text-base">
                          {ad.price.toLocaleString("fr-HT")} G.
                        </p>
                        <div className="text-[8px] font-black theme-text-secondary uppercase opacity-30">
                          {ad.date}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "my_ads" && (
          <div className="p-6 space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-black theme-text-secondary uppercase tracking-[0.2em]">
                {t("boutique.sections.my_ads_title")}
              </h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="theme-primary-bg text-white px-4 py-2 rounded-full text-xs font-bold active:scale-95 transition-all shadow-md flex items-center gap-2"
              >
                <Plus size={16} /> {t("boutique.create.btn")}
              </button>
            </div>

            <div className="space-y-4">
              {myAds.map((ad) => (
                <div
                  key={ad.id}
                  className="theme-card-bg border theme-border rounded-4xl overflow-hidden shadow-sm transition-all duration-300"
                >
                  <button
                    onClick={() =>
                      setExpandedAdId(expandedAdId === ad.id ? null : ad.id)
                    }
                    className="w-full flex items-center gap-4 p-4 hover:theme-bubble-bg transition-colors text-left"
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border theme-border">
                      <img
                        src={ad.images[0]}
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
                      <p className="text-[10px] theme-text-secondary font-bold uppercase mt-0.5">
                        {ad.date}
                      </p>
                    </div>
                    <div
                      className={`p-2 theme-bubble-bg rounded-full transition-transform duration-300 ${expandedAdId === ad.id ? "rotate-180" : ""}`}
                    >
                      <ChevronDown size={20} className="theme-text-secondary" />
                    </div>
                  </button>

                  {expandedAdId === ad.id && (
                    <div className="px-4 pb-6 pt-2 animate-in slide-in-from-top duration-300 border-t theme-border bg-gray-50/50 dark:bg-white/5">
                      <div className="space-y-4 mt-2">
                        <div className="flex items-center justify-between px-2">
                          <h5 className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                            Prospects intéressés
                          </h5>
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-[9px] font-black px-2 py-0.5 rounded-full">
                              {adConversations[ad.id]?.length || 0} contacts
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {adConversations[ad.id]?.length ? (
                            adConversations[ad.id].map((conv) => (
                              <button
                                key={conv.id}
                                onClick={() => navigate(`/chat/${conv.id}`)}
                                className="w-full flex items-center justify-between p-3.5 theme-card-bg border theme-border rounded-3xl hover:theme-primary-bg group transition-all active:scale-[0.98] shadow-sm"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden shrink-0 shadow-sm">
                                    <img
                                      src={conv.counterparty.avatar}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-bold theme-text-main text-sm group-hover:text-white transition-colors">
                                      {conv.counterparty.name}
                                    </p>
                                    <p className="text-[10px] theme-text-secondary group-hover:text-white/70 truncate max-w-37.5 italic">
                                      "{conv.lastMessage}"
                                    </p>
                                  </div>
                                </div>
                                <ChevronRight
                                  size={18}
                                  className="theme-text-secondary opacity-30 group-hover:opacity-100 group-hover:text-white transition-all"
                                />
                              </button>
                            ))
                          ) : (
                            <div className="p-8 text-center space-y-3 opacity-40 italic">
                              <UserCircle size={32} className="mx-auto" />
                              <p className="text-xs font-medium">
                                Aucun contact pour cette annonce pour le moment
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {myAds.length === 0 && (
                <div className="py-20 text-center opacity-30 italic text-sm">
                  Vous n'avez pas encore d'annonce.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "messages" && <MessagingHub isTab={true} />}
        {activeTab === "dashboard" && <MarketplaceDashboard />}
      </main>

      {activeTab === "home" && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-24 right-6 w-16 h-16 theme-primary-bg text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white dark:border-gray-900 group"
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black theme-text-main tracking-tight">
              {t("boutique.create.modal_title")}
            </h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="p-2 theme-bubble-bg rounded-full theme-text-secondary"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-6 pb-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                {t("boutique.create.field_title")}
              </label>
              <input
                type="text"
                className="w-full theme-bubble-bg p-4.5 rounded-2xl outline-none theme-text-main border theme-border font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                  {t("boutique.create.field_price")}
                </label>
                <input
                  type="number"
                  className="w-full theme-bubble-bg p-4.5 rounded-2xl outline-none theme-text-main border theme-border font-black"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                  {t("boutique.create.field_cat")}
                </label>
                <select className="w-full theme-bubble-bg p-4.5 rounded-2xl outline-none theme-text-main border theme-border font-bold">
                  <option>Maison</option>
                  <option>Électronique</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full theme-primary-bg text-white py-5 rounded-3xl font-black shadow-xl active:scale-95 transition-all uppercase tracking-[0.2em]"
            >
              {t("boutique.create.submit")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ServicesMarket;
