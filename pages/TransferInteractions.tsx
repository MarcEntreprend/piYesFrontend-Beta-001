//pages/TransferInteractions.tsx
// cette page affiche les interactions d'un utilisateur avec un contact

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  ChevronRight,
  History as HistoryIcon,
  X,
  ChevronDown,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { useTranslation, useGlobalSync } from "../App";
import Button from "../components/Button";
import {
  Transaction,
  TransactionType,
  TransactionRole,
  Contact,
} from "../shared/types";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../services/apiService";
import { useGroupedTransactions } from "../hooks/useGroupedTransactions";
import { HighlightedItem, useHighlight } from "../components/HighlightedItem";
import { displayMoney } from "../shared/money";
import PageHeader from "../components/PageHeader";
import { cacheService } from "../services/cacheService";

// Fonction pour obtenir le titre d'affichage d'une transaction
const getTransactionTitle = (tx: Transaction): string => {
  if (tx.description && tx.description.trim() !== "") {
    return tx.description;
  }
  const txType = tx.type?.toUpperCase() || "";
  const description = tx.description || "";
  if (txType === "TRANSFER" || txType === "P2P") {
    if (description.includes("Rappel")) return "Rappel de transfert";
    if (description.includes("lien") || description.includes("Link")) return "Paiement par lien";
    if (description.toLowerCase().includes("qr")) return "Paiement par QR Code";
    return "Transfert via clé";
  }
  switch (txType) {
    case "MOBILE_RECHARGE":
    case "RECHARGE":
      return "Recharge mobile";
    case "DEPOSIT":
      return "Dépôt sur compte";
    case "WITHDRAW":
    case "WITHDRAWAL":
      return "Retrait de fonds";
    case "INTERNATIONAL":
      return "Transfert international";
    default:
      return "";
  }
};

const TransferInteractions: React.FC = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contactId = searchParams.get("contactId");

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");
  const [contact, setContact] = useState<Contact | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const isFetching = useRef(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const { highlight } = useHighlight();

  // Monthly filter state
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [monthsWithData, setMonthsWithData] = useState<Set<string>>(new Set());
  const [yearsWithData, setYearsWithData] = useState<Set<number>>(new Set());

  const months = [
    t("common.months_full.january"),
    t("common.months_full.february"),
    t("common.months_full.march"),
    t("common.months_full.april"),
    t("common.months_full.may"),
    t("common.months_full.june"),
    t("common.months_full.july"),
    t("common.months_full.august"),
    t("common.months_full.september"),
    t("common.months_full.october"),
    t("common.months_full.november"),
    t("common.months_full.december"),
  ];

  const filterOrder = ["all", "sent", "received"] as const;
  const limit = 20;
  const CACHE_KEY = `interactions_${contactId || "all"}`;

  // Sauvegarde/restauration du cache
  useEffect(() => {
    const saved = sessionStorage.getItem(CACHE_KEY);
    if (saved) {
      try {
        const { transactions, offset: savedOffset, hasMore: savedHasMore, filter: savedFilter, selectedMonth: savedMonth, selectedYear: savedYear } = JSON.parse(saved);
        if (transactions?.length) {
          setAllTransactions(transactions);
          setOffset(savedOffset || 0);
          setHasMore(savedHasMore ?? true);
          if (savedFilter) setFilter(savedFilter);
          if (savedMonth !== undefined) setSelectedMonth(savedMonth);
          if (savedYear !== undefined) setSelectedYear(savedYear);
          setLoading(false);
        }
      } catch (e) { }
    }
  }, [CACHE_KEY]);

  useEffect(() => {
    if (allTransactions.length > 0) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        transactions: allTransactions,
        offset,
        hasMore,
        filter,
        selectedMonth,
        selectedYear,
      }));
    }
  }, [allTransactions, offset, hasMore, filter, selectedMonth, selectedYear, CACHE_KEY]);

  const loadTransactions = useCallback(async (isInitial = false) => {
    if (isFetching.current || (!isInitial && !hasMore)) return;
    isFetching.current = true;
    const currentOffset = isInitial ? 0 : offset;
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      let contactName = "";
      if (contactId) {
        const allContacts = await api.getContacts();
        const found = allContacts.find((c) => c.id === contactId);
        if (found && !contact) setContact(found);
        if (found) contactName = found.name;
      }

      const data = await api.getHistory({
        limit,
        offset: currentOffset,
        type: "all",
        ...(contactName ? { counterpartyName: contactName } : {}),
      });

      const transfers = data.filter((tx) => tx.type === TransactionType.TRANSFER);

      setAllTransactions((prev) => {
        const combined = isInitial ? transfers : [...prev, ...transfers];
        const seen = new Set();
        return combined.filter((tx) => {
          if (seen.has(tx.id)) return false;
          seen.add(tx.id);
          return true;
        });
      });

      setOffset(currentOffset + data.length);
      setHasMore(data.length === limit);

      // Calculer les mois/années avec données
      const monthSet = new Set<string>();
      const yearSet = new Set<number>();
      transfers.forEach((tx) => {
        const d = new Date(tx.date);
        monthSet.add(`${d.getFullYear()}-${d.getMonth()}`);
        yearSet.add(d.getFullYear());
      });
      setMonthsWithData(monthSet);
      setYearsWithData(yearSet);
    } catch (error) {
      console.error("Failed to load interactions:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetching.current = false;
    }
  }, [offset, hasMore, contactId, limit]);

  useEffect(() => {
    if (!isFetching.current && allTransactions.length === 0) {
      loadTransactions(true);
    }
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching.current) loadTransactions();
      },
      { threshold: 0.1, rootMargin: "150px" }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadTransactions]);

  // Filtrer par mois, recherche, et sens
  const filtered = useMemo(() => {
    return allTransactions.filter((tx) => {
      const txDate = new Date(tx.date);
      const matchesMonth = txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
      const matchesSearch = !searchTerm.trim() ||
        tx.counterpartyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === "all" ||
        (filter === "sent" && tx.role === TransactionRole.PAYER) ||
        (filter === "received" && tx.role === TransactionRole.RECEIVER);
      return matchesMonth && matchesSearch && matchesFilter;
    });
  }, [allTransactions, searchTerm, filter, selectedMonth, selectedYear]);

  const groupedTransactions = useGroupedTransactions(filtered, t, language);
  const toggleGroup = (key: string) => setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // Swipe
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX) return;
    const deltaX = e.touches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 50) {
      const currentIndex = filterOrder.indexOf(filter);
      if (deltaX > 0 && currentIndex > 0) setFilter(filterOrder[currentIndex - 1]);
      else if (deltaX < 0 && currentIndex < filterOrder.length - 1) setFilter(filterOrder[currentIndex + 1]);
      setTouchStartX(null);
    }
  };
  const handleTouchEnd = () => setTouchStartX(null);

  const getTransactionIcon = (tx: Transaction) => {
    if (tx.type === TransactionType.TRANSFER) {
      return tx.role === TransactionRole.PAYER ? <ArrowUpRight size={18} className="theme-text-secondary" /> : <ArrowDownLeft size={18} className="text-green-600" />;
    }
    return <ArrowUpRight size={18} />;
  };

  // Années disponibles (uniquement celles avec données, + année en cours par défaut)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from(yearsWithData);
    if (!years.includes(currentYear)) years.unshift(currentYear);
    return years.sort((a, b) => b - a);
  }, [yearsWithData]);

  return (
    <div
      className="min-h-screen theme-card-bg pb-24"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="sticky top-0 z-30 theme-card-bg border-b theme-border">
        <PageHeader
          title={contact ? t("reports.labels.interactions.with_contact", { name: contact.name.split(" ")[0] }) : t("reports.labels.interactions.my_interactions")}
          rightElement={
            <button onClick={() => setShowMonthPicker(true)} className="p-2 theme-bubble-bg rounded-full theme-text-secondary active:scale-90">
              <Calendar size={20} className="theme-primary-text" />
            </button>
          }
        >
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-secondary" size={18} />
            <input
              type="text"
              placeholder={t("reports.labels.interactions.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full theme-bubble-bg rounded-full py-2 pl-10 pr-4 text-sm theme-text-main outline-none border border-transparent focus:border-(--primary-color)"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
            {filterOrder.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f ? "theme-primary-bg text-white shadow-lg" : "theme-bubble-bg theme-text-secondary border theme-border"
                  }`}
              >
                {f === "all" ? t("reports.labels.interactions.all") : f === "sent" ? t("reports.labels.interactions.sent") : t("reports.labels.interactions.received")}
              </button>
            ))}
          </div>
        </PageHeader>
      </div>

      <div className="p-6">
        {loading && filtered.length === 0 ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl shimmer"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-50 dark:bg-gray-800 rounded shimmer"></div>
                  <div className="h-3 w-1/2 bg-gray-50 dark:bg-gray-800 rounded shimmer"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedTransactions.map((group) => (
              <div key={group.key} className="space-y-3">
                <button onClick={() => toggleGroup(group.key)} className="flex items-center justify-between w-full group/header">
                  <h2 className="text-xs font-black uppercase tracking-widest theme-text-secondary opacity-60">{group.title}</h2>
                  <div className="theme-text-secondary opacity-40 group-hover/header:opacity-100 transition-opacity">
                    {collapsedGroups[group.key] ? <ChevronRightIcon size={16} /> : <ChevronDownIcon size={16} />}
                  </div>
                </button>
                {!collapsedGroups[group.key] && (
                  <div className="space-y-4">
                    {group.transactions.map((tx) => (
                      <HighlightedItem key={tx.id} id={tx.id} highlightDuration={2500} scrollBehavior="smooth" scrollBlock="center">
                        <motion.div
                          layoutId={tx.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-4 cursor-pointer p-3 -mx-3 rounded-2xl transition-all duration-700 relative overflow-hidden group active:bg-gray-50 dark:active:bg-white/5"
                          onClick={() => navigate(`/receipt/${tx.id}?type=${tx.type}&role=${tx.role}`)}
                        >
                          <div className="w-12 h-12 theme-bubble-bg rounded-full flex items-center justify-center theme-text-secondary border theme-border group-hover:scale-110 transition-transform shrink-0">
                            {getTransactionIcon(tx)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline gap-2">
                              <p className="font-bold theme-text-main text-sm truncate">{tx.counterpartyName}</p>
                              <div className="shrink-0 text-right">
                                <span className={`font-black whitespace-nowrap block ${tx.role === TransactionRole.PAYER ? "theme-text-main" : "text-green-600"} text-sm`}>
                                  {tx.role === TransactionRole.PAYER ? "-" : "+"} {displayMoney(tx.amount * 100)} {t("currency.symbol")}
                                </span>
                              </div>
                            </div>
                            <p className="theme-text-secondary text-xs truncate mt-0.5">{getTransactionTitle(tx)}</p>
                            <p className="theme-text-secondary text-[10px] opacity-60 mt-0.5">
                              {new Date(tx.date).toLocaleTimeString(language === "ht" ? "ht-HT" : "fr-HT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </p>
                          </div>
                        </motion.div>
                      </HighlightedItem>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={observerTarget} className="h-10 flex items-center justify-center">
              {loadingMore && <div className="w-6 h-6 border-2 border-(--primary-color) border-t-transparent rounded-full animate-spin" />}
              {!hasMore && filtered.length > 0 && <p className="text-xs theme-text-secondary opacity-40 font-medium italic">{t("history.end_of_history")}</p>}
            </div>
            {filtered.length === 0 && !loading && (
              <div className="py-20 text-center flex flex-col items-center gap-4 opacity-40">
                <div className="w-20 h-20 theme-bubble-bg rounded-full flex items-center justify-center mx-auto"><HistoryIcon size={32} className="theme-text-secondary" /></div>
                <p className="text-lg font-black theme-text-main">{t("reports.labels.interactions.none")}</p>
                <p className="text-xs theme-text-secondary">{t("reports.labels.interactions.for_period", { month: months[selectedMonth], year: selectedYear })}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Month/Year Picker Modal */}
      <AnimatePresence>
        {showMonthPicker && (
          <div className="fixed inset-0 z-100 flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMonthPicker(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md theme-card-bg rounded-t-[40px] p-8 space-y-8 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black theme-text-main">{t("reports.labels.interactions.period_title")}</h3>
                <button onClick={() => setShowMonthPicker(false)} className="p-2 theme-bubble-bg rounded-full theme-text-secondary"><X size={20} /></button>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">{t("reports.labels.interactions.year")}</p>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${selectedYear === year ? "theme-primary-bg text-white shadow-lg" : "theme-bubble-bg theme-text-main border theme-border"}`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">{t("reports.labels.interactions.month")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {months.map((month, index) => {
                      const hasData = monthsWithData.has(`${selectedYear}-${index}`);
                      return (
                        <button
                          key={month}
                          onClick={() => hasData && setSelectedMonth(index)}
                          disabled={!hasData}
                          className={`py-4 rounded-2xl text-xs font-bold transition-all ${selectedMonth === index && hasData
                              ? "theme-primary-bg text-white shadow-lg"
                              : !hasData
                                ? "opacity-30 cursor-not-allowed theme-bubble-bg theme-text-main border theme-border"
                                : "theme-bubble-bg theme-text-main border theme-border"
                            }`}
                        >
                          {month}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button onClick={() => setShowMonthPicker(false)} variant="primary" fullWidth className="py-5 rounded-3xl font-black shadow-xl uppercase tracking-widest">
                  {t("reports.labels.interactions.apply")}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransferInteractions;