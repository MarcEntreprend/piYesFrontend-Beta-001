import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  X,
  ChevronRight,
  MapPin,
  Tag,
  DollarSign,
  Star,
  ArrowLeft,
  Check,
  RotateCcw,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Plus,
  Minus,
  Trash2,
  ArrowRightLeft,
} from "lucide-react";
import { useTranslation } from "../App";
import PageHeader from "../components/PageHeader";
import { motion, AnimatePresence } from "motion/react";

const categories = [
  {
    id: "electronics",
    label: "Électronique",
    icon: "📱",
    sub: ["Téléphones", "Ordinateurs", "Audio", "Accessoires"],
  },
  {
    id: "vehicles",
    label: "Véhicules",
    icon: "🚗",
    sub: ["Voitures", "Motos", "Pièces", "Entretien"],
  },
  {
    id: "home",
    label: "Maison",
    icon: "🏠",
    sub: ["Meubles", "Électroménager", "Déco", "Jardin"],
  },
  {
    id: "fashion",
    label: "Mode",
    icon: "👕",
    sub: ["Vêtements", "Chaussures", "Accessoires", "Beauté"],
  },
  {
    id: "services",
    label: "Services",
    icon: "🛠️",
    sub: ["Réparation", "Cours", "Nettoyage", "Transport"],
  },
];

const MarketplaceSearch: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [compareList, setCompareList] = useState<any[]>([]);
  const [showCompareTool, setShowCompareTool] = useState(false);

  const suggestions = useMemo(() => {
    if (!searchTerm) return [];
    const all = [
      "iPhone 15 Pro",
      "Samsung S24",
      "Honda Civic",
      "Toyota Hilux",
      "MacBook Air",
      "AirPods Pro",
    ];
    return all.filter((s) =>
      s.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm]);

  const toggleCompare = (ad: any) => {
    setCompareList((prev) => {
      if (prev.find((item) => item.id === ad.id)) {
        return prev.filter((item) => item.id !== ad.id);
      }
      if (prev.length >= 3) return prev; // Limit to 3
      return [...prev, ad];
    });
  };

  const ads = [
    {
      id: "ad1",
      title: "iPhone 15 Pro Max",
      price: 185000,
      location: "Pétion-Ville",
      rating: 4.9,
      image:
        "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
      category: "electronics",
    },
    {
      id: "ad2",
      title: "Honda Fit 2018",
      price: 1350000,
      location: "Delmas",
      rating: 4.7,
      image:
        "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&h=400&fit=crop",
      category: "vehicles",
    },
    {
      id: "ad3",
      title: "MacBook Pro M3",
      price: 250000,
      location: "Pétion-Ville",
      rating: 5.0,
      image:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
      category: "electronics",
    },
    {
      id: "ad4",
      title: "Canapé 3 places",
      price: 45000,
      location: "Tabarre",
      rating: 4.5,
      image:
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
      category: "home",
    },
  ];

  return (
    <div className="theme-card-bg min-h-screen pb-32 flex flex-col">
      <PageHeader
        title={t("boutique.search.advanced")}
        onBack={() => navigate("/services")}
      />

      <main className="flex-1 p-6 space-y-8">
        {/* Search Bar with Autocomplete */}
        <div className="relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-secondary opacity-40 group-focus-within:theme-primary-text transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder={t("boutique.search.autocomplete_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full theme-bubble-bg py-5 pl-12 pr-12 rounded-3xl outline-none theme-text-main text-sm focus:theme-card-bg focus:shadow-md transition-all border theme-border font-bold"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 theme-bubble-bg rounded-full theme-text-secondary"
            >
              <X size={16} />
            </button>
          )}

          {/* Autocomplete Suggestions */}
          <AnimatePresence>
            {searchTerm && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 w-full mt-2 theme-card-bg border theme-border rounded-3xl shadow-2xl z-50 overflow-hidden"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSearchTerm(s)}
                    className="w-full p-4 flex items-center gap-3 hover:theme-bubble-bg text-left border-b theme-border last:border-0 transition-colors"
                  >
                    <Search
                      size={14}
                      className="theme-text-secondary opacity-40"
                    />
                    <span className="text-sm theme-text-main font-medium">
                      {s}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[11px] font-black theme-text-secondary uppercase tracking-[0.2em]">
              {t("boutique.search.categories")}
            </h3>
            <button className="text-[10px] font-bold theme-primary-text">
              Tout voir
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === cat.id ? null : cat.id,
                  )
                }
                className={`flex flex-col items-center gap-3 p-5 rounded-4xl border transition-all min-w-25 ${selectedCategory === cat.id ? "theme-primary-bg text-white shadow-lg scale-105" : "theme-card-bg theme-border theme-text-main hover:theme-bubble-bg"}`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Subcategories (if category selected) */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 overflow-x-auto no-scrollbar"
            >
              {categories
                .find((c) => c.id === selectedCategory)
                ?.sub.map((sub) => (
                  <button
                    key={sub}
                    onClick={() =>
                      setSelectedSub(selectedSub === sub ? null : sub)
                    }
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${selectedSub === sub ? "theme-primary-bg text-white" : "theme-bubble-bg theme-text-secondary theme-border"}`}
                  >
                    {sub}
                  </button>
                ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters & View Toggle */}
        <div className="flex justify-between items-center px-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest ${showFilters ? "theme-primary-bg text-white" : "theme-bubble-bg theme-text-secondary theme-border"}`}
          >
            <SlidersHorizontal size={14} /> {t("boutique.search.filters")}
          </button>
          <div className="flex p-1 theme-bubble-bg rounded-full border theme-border">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-full transition-all ${viewMode === "grid" ? "theme-card-bg theme-primary-text shadow-sm" : "theme-text-secondary opacity-40"}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-full transition-all ${viewMode === "list" ? "theme-card-bg theme-primary-text shadow-sm" : "theme-text-secondary opacity-40"}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Filter Menu */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 theme-card-bg border theme-border rounded-4xl space-y-6 shadow-xl"
            >
              <div className="space-y-4">
                <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                  {t("boutique.search.price_range")}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    placeholder="Min"
                    className="flex-1 theme-bubble-bg p-3 rounded-xl outline-none text-xs font-bold theme-text-main border theme-border"
                  />
                  <ArrowRightLeft
                    size={14}
                    className="theme-text-secondary opacity-30"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="flex-1 theme-bubble-bg p-3 rounded-xl outline-none text-xs font-bold theme-text-main border theme-border"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                  {t("boutique.search.location")}
                </label>
                <select className="w-full theme-bubble-bg p-3 rounded-xl outline-none text-xs font-bold theme-text-main border theme-border">
                  <option>Tout Haïti</option>
                  <option>Pétion-Ville</option>
                  <option>Delmas</option>
                  <option>Cap-Haïtien</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 py-4 theme-bubble-bg theme-text-secondary rounded-[20px] font-black text-[10px] uppercase tracking-widest border theme-border active:scale-95 transition-all">
                  Réinitialiser
                </button>
                <button className="flex-1 py-4 theme-primary-bg text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                  Appliquer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div
          className={
            viewMode === "grid" ? "grid grid-cols-2 gap-4" : "space-y-4"
          }
        >
          {ads.map((ad) => (
            <motion.div
              key={ad.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`theme-card-bg border theme-border rounded-4xl overflow-hidden shadow-sm active:scale-[0.98] transition-all group relative ${viewMode === "list" ? "flex gap-4 p-4" : ""}`}
            >
              <div
                onClick={() => navigate(`/ad/${ad.id}`)}
                className={`${viewMode === "list" ? "w-24 h-24 rounded-2xl" : "aspect-square"} overflow-hidden shrink-0`}
              >
                <img src={ad.image} className="w-full h-full object-cover" />
              </div>
              <div
                className={`p-4 flex flex-col justify-between flex-1 ${viewMode === "list" ? "py-1" : ""}`}
              >
                <div>
                  <h4 className="font-bold theme-text-main text-xs line-clamp-2">
                    {ad.title}
                  </h4>
                  <div className="flex items-center gap-1.5 opacity-50 mt-1">
                    <MapPin size={10} />
                    <span className="text-[8px] font-bold uppercase">
                      {ad.location}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <p className="theme-primary-text font-black text-sm">
                    {ad.price.toLocaleString("fr-HT")} G.
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompare(ad);
                    }}
                    className={`p-2 rounded-full transition-all ${compareList.find((i) => i.id === ad.id) ? "theme-primary-bg text-white" : "theme-bubble-bg theme-text-secondary"}`}
                  >
                    <ArrowRightLeft size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Comparison Tool Floating Bar */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md theme-card-bg border theme-border rounded-4xl shadow-2xl p-4 z-70 flex items-center justify-between gap-4"
          >
            <div className="flex -space-x-3">
              {compareList.map((item) => (
                <div
                  key={item.id}
                  className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 overflow-hidden shadow-md"
                >
                  <img
                    src={item.image}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black theme-text-main uppercase tracking-widest">
                {compareList.length} items sélectionnés
              </p>
              <p className="text-[8px] theme-text-secondary font-bold uppercase">
                Comparer les prix et specs
              </p>
            </div>
            <button
              onClick={() => setShowCompareTool(true)}
              className="theme-primary-bg text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              {t("boutique.search.compare")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showCompareTool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 theme-card-bg flex flex-col"
          >
            <PageHeader
              title={t("boutique.search.comparison_tool")}
              onBack={() => setShowCompareTool(false)}
            />
            <div className="flex-1 overflow-x-auto p-6">
              <div className="flex gap-6 min-w-max h-full">
                {compareList.map((item) => (
                  <div key={item.id} className="w-64 flex flex-col gap-6">
                    <div className="aspect-square rounded-4xl overflow-hidden border theme-border shadow-md">
                      <img
                        src={item.image}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h4 className="font-black theme-text-main text-base">
                          {item.title}
                        </h4>
                        <p className="theme-primary-text font-black text-xl">
                          {item.price.toLocaleString("fr-HT")} G.
                        </p>
                      </div>
                      <div className="p-5 theme-bubble-bg border theme-border rounded-3xl space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black theme-text-secondary uppercase">
                            Localisation
                          </span>
                          <span className="text-[10px] font-bold theme-text-main">
                            {item.location}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black theme-text-secondary uppercase">
                            Note
                          </span>
                          <div className="flex items-center gap-1">
                            <Star
                              size={10}
                              className="text-amber-500 fill-amber-500"
                            />
                            <span className="text-[10px] font-bold theme-text-main">
                              {item.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/ad/${item.id}`)}
                        className="w-full py-4 theme-primary-bg text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest shadow-lg"
                      >
                        Voir l'annonce
                      </button>
                      <button
                        onClick={() => toggleCompare(item)}
                        className="w-full py-4 theme-bubble-bg theme-text-secondary rounded-[20px] font-black text-[10px] uppercase tracking-widest border theme-border"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketplaceSearch;
