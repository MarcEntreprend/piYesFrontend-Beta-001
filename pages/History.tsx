// pages\History.tsx

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
/* Use react-router core for hooks */
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  Search,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  ArrowDown,
  Globe,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  LayoutList,
  Smartphone,
  RotateCcw,
  Repeat,
} from "lucide-react";
import { api } from "../services/apiService";
import { Transaction, TransactionType, TransactionRole } from "../shared/types";
import { useTranslation } from "../App";
import { useGroupedTransactions } from "../hooks/useGroupedTransactions";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedButton from "../components/AnimatedButton";
import PageHeader from "../components/PageHeader";
import { App as CapacitorApp } from "@capacitor/app";
import { useRealtimeHistory } from '../hooks/useRealtimeHistory';

const History: React.FC = () => {
  const { t, language } = useTranslation();
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const navigate = useNavigate();

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const isFetching = useRef(false);
  const [highlightedTxId, setHighlightedTxId] = useState<string | null>(null);

  // États pour le swipe et la persistance
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const historyStateKey = 'piyes-history-state'; // Clé unique pour sessionStorage


  const limit = 20;
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadTransactions = useCallback(
    async (isInitial = false) => {
      if (isFetching.current || (!isInitial && !hasMore)) return;

      isFetching.current = true;
      const currentOffset = isInitial ? 0 : offset;

      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        // Toujours charger depuis le flux "all" pour alimenter le pool local
        const data = await api.getHistory({
          limit,
          offset: currentOffset,
          type: "all",
        });

        setAllTransactions((prev) => {
          const combined = isInitial ? data : [...prev, ...data];
          // Déduplication par ID pour éviter les erreurs de clés React
          const seen = new Set();
          return combined.filter((tx) => {
            if (seen.has(tx.id)) return false;
            seen.add(tx.id);
            return true;
          });
        });

        setOffset(currentOffset + data.length);
        setHasMore(data.length === limit);
      } catch (error) {
        console.error("Failed to load transactions", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetching.current = false;
      }
    },
    [offset, hasMore],
  );

  // Realtime: écoute les nouvelles transactions et recharge
  const handleNewTransaction = useCallback(() => {
    console.log('[History] New transaction detected, reloading...');
    // Reset offset et recharger depuis le début
    setOffset(0);
    setHasMore(true);
    setAllTransactions([]);
    loadTransactions(true);
  }, [loadTransactions]);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('piyes-user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserId(user.id);
      } catch (e) { }
    }
  }, []);

  useRealtimeHistory(userId, handleNewTransaction);

  const [searchTerm, setSearchTerm] = useState("");

  // Filtrage local basé sur le pool global de transactions
  const filtered = useMemo(() => {
    let base = allTransactions;

    if (activeFilter !== "all") {
      base = allTransactions.filter((tx) => {
        if (activeFilter === "received")
          return (
            tx.role === TransactionRole.RECEIVER &&
            tx.type === TransactionType.TRANSFER
          );
        if (activeFilter === "sent")
          return (
            (tx.role === TransactionRole.PAYER &&
              tx.type === TransactionType.TRANSFER) ||
            tx.type === TransactionType.RECHARGE
          );
        if (activeFilter === "deposits")
          return tx.type === TransactionType.DEPOSIT;
        if (activeFilter === "withdrawals")
          return tx.type === TransactionType.WITHDRAW;
        if (activeFilter === "international")
          return tx.type === TransactionType.INTERNATIONAL;
        return true;
      });
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      base = base.filter(
        (tx) =>
          tx.counterpartyName.toLowerCase().includes(s) ||
          tx.description.toLowerCase().includes(s),
      );
    }

    return base;
  }, [allTransactions, activeFilter, searchTerm]);

  // Chargement initial - Utilise le cache sessionStorage si disponible
  useEffect(() => {
    const saved = sessionStorage.getItem(historyStateKey);
    const hasCachedTransactions = saved && JSON.parse(saved).transactions?.length > 0;

    // Ne charger depuis l'API que s'il n'y a pas de transactions en cache
    if (!isFetching.current && allTransactions.length === 0 && !hasCachedTransactions) {
      loadTransactions(true);
    }
  }, []);

  // Déclenchement automatique si le filtre actif n'a pas assez d'éléments
  useEffect(() => {
    if (
      activeFilter !== "all" &&
      filtered.length < 15 &&
      hasMore &&
      !loading &&
      !loadingMore &&
      !isFetching.current
    ) {
      loadTransactions();
    }
  }, [
    filtered.length,
    activeFilter,
    hasMore,
    loading,
    loadingMore,
    loadTransactions,
  ]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching.current) {
          loadTransactions();
        }
      },
      { threshold: 0.1, rootMargin: "150px" },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadTransactions]);

  // Handle Scroll to specific transaction
  useEffect(() => {
    const targetId = searchParams.get("scroll");
    if (targetId && filtered.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        setHighlightedTxId(targetId);
        setTimeout(() => setHighlightedTxId(null), 2500);
      }, 500);
    }
  }, [searchParams, filtered]);

  // Restaurer l'état sauvegardé au montage (filtre, scroll ET transactions)
  useEffect(() => {
    const saved = sessionStorage.getItem(historyStateKey);
    if (saved) {
      const { filter, scrollPos, transactions, offset: savedOffset, hasMore: savedHasMore } = JSON.parse(saved);
      if (filter) setActiveFilter(filter);
      //  Restaurer les transactions depuis le cache session
      if (transactions && Array.isArray(transactions) && transactions.length > 0) {
        setAllTransactions(transactions);
        setOffset(savedOffset || 0);
        setHasMore(savedHasMore ?? true);
        setLoading(false); // Important : ne pas afficher le loader
      }
      setTimeout(() => window.scrollTo(0, scrollPos || 0), 100);
    }

    // Sauvegarder avant de quitter la page
    const handleBeforeUnload = () => {
      sessionStorage.setItem(historyStateKey, JSON.stringify({
        filter: activeFilter,
        scrollPos: window.scrollY,
        //  Sauvegarder aussi les transactions
        transactions: allTransactions,
        offset: offset,
        hasMore: hasMore
      }));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); //  Dépendance vide - exécuté une seule fois au montage

  // Sauvegarder automatiquement quand les transactions changent (après chargement)
  useEffect(() => {
    if (allTransactions.length > 0) {
      const saved = sessionStorage.getItem(historyStateKey);
      const existingData = saved ? JSON.parse(saved) : {};
      sessionStorage.setItem(historyStateKey, JSON.stringify({
        ...existingData,
        transactions: allTransactions,
        offset: offset,
        hasMore: hasMore
      }));
    }
  }, [allTransactions, offset, hasMore]);

  // Sauvegarder quand le filtre change
  useEffect(() => {
    const saved = sessionStorage.getItem(historyStateKey);
    const scrollPos = saved ? JSON.parse(saved).scrollPos : 0;
    sessionStorage.setItem(historyStateKey, JSON.stringify({
      filter: activeFilter,
      scrollPos
    }));
  }, [activeFilter]);

  const groupedTransactions = useGroupedTransactions(filtered, t, language);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Gestion du swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX) return;
    const deltaX = e.touches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 50) {
      const currentIndex = filters.findIndex(f => f.id === activeFilter);
      if (deltaX > 0 && currentIndex > 0) {
        setActiveFilter(filters[currentIndex - 1].id);
      } else if (deltaX < 0 && currentIndex < filters.length - 1) {
        setActiveFilter(filters[currentIndex + 1].id);
      }
      setTouchStartX(null);
    }
  };

  const handleTouchEnd = () => setTouchStartX(null);

  const getTransactionIcon = (tx: Transaction) => {
    if (tx.status === "PENDING")
      return (
        <RotateCcw
          size={18}
          className="theme-text-secondary animate-spin-slow"
        />
      );

    if (tx.type === TransactionType.DEPOSIT)
      return <Plus size={18} className="text-green-600" />;
    if (tx.type === TransactionType.WITHDRAW)
      return <ArrowDown size={18} className="text-red-500" />;
    if (tx.type === TransactionType.INTERNATIONAL)
      return <Globe size={18} className="theme-primary-text" />;
    if (tx.type === TransactionType.RECHARGE)
      return <Smartphone size={18} className="theme-primary-text" />;

    if (tx.type === TransactionType.TRANSFER) {
      return tx.role === TransactionRole.PAYER ? (
        <ArrowUpRight size={18} className="theme-text-secondary" />
      ) : (
        <ArrowDownLeft size={18} className="text-green-600" />
      );
    }

    return <Repeat size={18} />;
  };

  const filters = [
    {
      id: "all",
      label: t("history.filters.all"),
      icon: <LayoutList size={16} />,
    },
    {
      id: "received",
      label: t("history.filters.received"),
      icon: <ArrowDownLeft size={16} />,
    },
    {
      id: "sent",
      label: t("history.filters.sent"),
      icon: <ArrowUpRight size={16} />,
    },
    {
      id: "deposits",
      label: t("history.filters.deposits"),
      icon: <Plus size={16} />,
    },
    {
      id: "withdrawals",
      label: t("history.filters.withdrawals"),
      icon: <ArrowDown size={16} />,
    },
    {
      id: "international",
      label: t("history.filters.intl"),
      icon: <Globe size={16} />,
    },
  ];

  // Gestion du bouton retour matériel
  useEffect(() => {
    let listener: any = null;

    CapacitorApp.addListener('backButton', () => {
      if (activeFilter !== 'all') {
        setActiveFilter('all');
      } else {
        navigate(-1);
      }
    }).then((handle) => {
      listener = handle;
    });

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [activeFilter, navigate]);

  return (
    <div
      className="theme-card-bg min-h-screen pb-20"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header sticky - wrapper nécessaire pour que sticky fonctionne */}
      <div className="sticky top-0 z-30 theme-card-bg border-b theme-border">
        <PageHeader
          title={t("history.title")}
          rightElement={
            <button
              onClick={() => navigate("/report")}
              className="p-2 theme-text-secondary hover:theme-bubble-bg rounded-full transition-colors active:scale-90"
            >
              <BarChart3 size={22} />
            </button>
          }
        >
          <div className="relative mb-3">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-secondary"
              size={18}
            />
            <input
              type="text"
              placeholder={t("history.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full theme-bubble-bg rounded-full py-2 pl-10 pr-4 text-sm theme-text-main focus:bg-gray-200 transition-colors outline-none border border-transparent focus:border-(--primary-color)"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
            {filters.map((f) => (
              <AnimatedButton
                key={f.id}
                isSelected={activeFilter === f.id}
                onClick={() => setActiveFilter(f.id)}
                icon={f.icon}
                label={f.label}
                accentColor="var(--primary-color)"
                activeBg="var(--primary-color)"
                activeText="#FFFFFF"
                inactiveBg="var(--bubble-bg)"
                inactiveText="var(--text-secondary)"
                iconActiveBg="rgba(255,255,255,0.2)"
                iconInactiveBg="rgba(0,0,0,0.05)"
                iconActiveColor="#FFFFFF"
                iconInactiveColor="var(--text-secondary)"
              />
            ))}
          </div>
        </PageHeader>
      </div>

      {/* Contenu scrollable */}
      <div className="p-6">
        {loading && filtered.length === 0 ? (
          <div className="space-y-8">
            {[1, 2, 3, 4, 5].map((i) => (
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
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="flex items-center justify-between w-full group/header"
                >
                  <h2 className="text-xs font-black uppercase tracking-widest theme-text-secondary opacity-60">
                    {group.title}
                  </h2>
                  <div className="theme-text-secondary opacity-40 group-hover/header:opacity-100 transition-opacity">
                    {collapsedGroups[group.key] ? (
                      <ChevronRight size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </div>
                </button>

                {!collapsedGroups[group.key] && (
                  <div className="space-y-4">
                    {group.transactions.map((tx) => (
                      <motion.div
                        layoutId={tx.id}
                        id={tx.id}
                        key={tx.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-start gap-4 cursor-pointer p-3 -mx-3 rounded-2xl transition-all duration-700 relative overflow-hidden group ${highlightedTxId === tx.id
                          ? "ring-2 ring-(--primary-color) bg-(--primary-color)/10 scale-[1.02] z-10"
                          : "active:bg-gray-50 dark:active:bg-white/5"
                          }`}
                        onClick={() =>
                          navigate(
                            `/receipt/${tx.id}?type=${tx.type}&role=${tx.role}`,
                          )
                        }
                      >
                        <div className="w-12 h-12 theme-bubble-bg rounded-full flex items-center justify-center theme-text-secondary border theme-border group-hover:scale-110 transition-transform shrink-0">
                          {getTransactionIcon(tx)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline gap-2">
                            <p className="font-bold theme-text-main text-sm truncate">
                              {tx.counterpartyName}
                            </p>
                            <div className="shrink-0 text-right w-25">
                              <span
                                className={`font-black whitespace-nowrap block ${tx.role === TransactionRole.PAYER ? "theme-text-main" : "text-green-600"} ${tx.amount.toString().split(".")[0].length > 5 ? "text-[10px]" : "text-sm"}`}
                              >
                                {tx.role === TransactionRole.PAYER ? "-" : "+"}{" "}
                                {tx.amount.toLocaleString(
                                  language === "ht" ? "ht-HT" : "fr-HT",
                                )}{" "}
                                {t("currency.symbol")}
                              </span>
                            </div>
                          </div>
                          <p className="theme-text-secondary text-xs truncate mt-0.5">
                            {tx.description}
                          </p>
                          <p className="theme-text-secondary text-[10px] opacity-60 mt-0.5">
                            {new Date(tx.date).toLocaleTimeString(
                              language === "ht" ? "ht-HT" : "fr-HT",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              },
                            )}
                          </p>
                          {tx.type === TransactionType.INTERNATIONAL && (
                            <div className="flex items-center gap-1 mt-1">
                              <CheckCircle2
                                size={10}
                                className="text-blue-500"
                              />
                              <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">
                                Verified Intl
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Infinite Scroll Trigger */}
            <div
              ref={observerTarget}
              className="h-10 flex items-center justify-center"
            >
              {loadingMore && (
                <div className="flex gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full theme-primary-bg animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 rounded-full theme-primary-bg animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 rounded-full theme-primary-bg animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              )}
              {!hasMore && filtered.length > 0 && (
                <p className="text-xs theme-text-secondary opacity-40 font-medium italic">
                  {t("history.end_of_history")}
                </p>
              )}
            </div>

            {filtered.length === 0 && !loading && (
              <div className="py-20 text-center flex flex-col items-center gap-4">
                <div className="w-20 h-20 theme-bubble-bg rounded-full flex items-center justify-center theme-text-secondary opacity-20">
                  <Search size={40} />
                </div>
                <p className="theme-text-secondary opacity-50 italic text-sm">
                  {t("history.empty")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
