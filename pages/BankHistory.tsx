// pages/BankHistory.tsx
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import {
  ArrowLeft,
  Search,
  MoreVertical,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  ArrowDown,
  Globe,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Share2,
  Download,
  Landmark,
} from "lucide-react";
import { api } from "../services/apiService";
import {
  Transaction,
  TransactionType,
  TransactionRole,
  Account,
} from "../shared/types";
import { useTranslation } from "../App";
import { useGroupedTransactions } from "../hooks/useGroupedTransactions";
import { motion, AnimatePresence } from "framer-motion";
import { useRealtimeHistory } from '../hooks/useRealtimeHistory';
import { cacheService } from '../services/cacheService';


const BankHistory: React.FC = () => {
  const { accountId } = useParams();
  const { t, language } = useTranslation();
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const navigate = useNavigate();

  const [account, setAccount] = useState<Account | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const isFetching = useRef(false);

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
        const data = await api.getHistory({
          limit,
          offset: currentOffset,
          type: "all",
          accountId,
        });

        setAllTransactions((prev) => {
          const combined = isInitial ? data : [...prev, ...data];
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
    [offset, hasMore, accountId],
  );

  useEffect(() => {
    const userStr = localStorage.getItem('piyes-user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserId(user.id);
      } catch (e) { }
    }
  }, []);

  const handleNewTransaction = useCallback(() => {
    console.log('[BankHistory] New transaction detected, reloading...');
    setOffset(0);
    setHasMore(true);
    setAllTransactions([]);
    loadTransactions(true);
  }, [loadTransactions]);

  useRealtimeHistory(userId, handleNewTransaction);

  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    let base = allTransactions;

    if (activeFilter !== "all") {
      base = allTransactions.filter((tx) => {
        if (activeFilter === "received") {
          // Reçus : P2P reçu OU interbancaire reçu
          return (tx.type === TransactionType.TRANSFER && tx.role === TransactionRole.RECEIVER) ||
            (tx.type === TransactionType.INTERBANK_OUT && tx.role === TransactionRole.RECEIVER);
        }
        if (activeFilter === "sent") {
          // Envoyés : P2P envoyé OU interbancaire envoyé
          return (tx.type === TransactionType.TRANSFER && tx.role === TransactionRole.PAYER) ||
            (tx.type === TransactionType.INTERBANK_OUT && tx.role === TransactionRole.PAYER);
        }
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

  // charge le compte et les transactions
  useEffect(() => {
    const fetchAccount = async () => {
      const accounts = await api.getAccounts();
      const found = accounts.find((a) => a.id === accountId);
      setAccount(found || null);
    };
    fetchAccount();
    loadTransactions(true);
  }, [accountId]);

  // charge les transactions quand l'utilisateur revient sur la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Invalider le cache des transactions avant de recharger
        cacheService.clearHistoryCache();
        setOffset(0);
        setHasMore(true);
        setAllTransactions([]);
        loadTransactions(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadTransactions]);;

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

  useEffect(() => {
    const targetId = searchParams.get("scroll");
    if (targetId && filtered.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add(
            "ring-4",
            "ring-[var(--primary-color)]",
            "ring-opacity-20",
            "rounded-2xl",
            "scale-[1.02]",
          );

          setTimeout(() => {
            el.classList.remove("ring-4", "scale-[1.02]");
          }, 3000);
        }
      }, 500);
    }
  }, [searchParams, filtered]);

  const groupedTransactions = useGroupedTransactions(filtered, t, language);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Swipe handlers
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
    if (tx.type === TransactionType.DEPOSIT)
      return <Plus size={18} className="text-green-600" />;
    if (tx.type === TransactionType.WITHDRAW)
      return <ArrowDown size={18} className="text-red-500" />;
    if (tx.type === TransactionType.INTERNATIONAL)
      return <Globe size={18} className="theme-primary-text" />;

    if (tx.type === TransactionType.TRANSFER) {
      return tx.role === TransactionRole.PAYER ? (
        <ArrowUpRight size={18} className="theme-text-secondary" />
      ) : (
        <ArrowDownLeft size={18} className="text-green-600" />
      );
    }

    return <ArrowUpRight size={18} className="theme-text-secondary" />;
  };

  const filters = [
    { id: "all", label: t("history.filters.all") },
    { id: "received", label: t("history.filters.received") },
    { id: "sent", label: t("history.filters.sent") },
  ];

  return (
    <div
      className="theme-card-bg min-h-screen pb-20"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <header
        className="px-6 pt-12 pb-2 sticky top-0 z-30 transition-colors duration-500 shadow-sm border-b theme-border"
        style={{ backgroundColor: account?.color || "var(--card-bg)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 bg-white/20 text-white rounded-full backdrop-blur-md active:scale-90 transition-transform"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-lg font-black text-white leading-none">
                {account?.label}
              </h1>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">
                {t("history.title")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-white/20 text-white rounded-full backdrop-blur-md">
              <Share2 size={18} />
            </button>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 bg-white/20 text-white rounded-full backdrop-blur-md active:scale-90 transition-transform"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50"
            size={16}
          />
          <input
            type="text"
            placeholder={t("history.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-full py-2.5 pl-11 pr-4 text-sm text-white placeholder-white/50 outline-none focus:bg-white/20 transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeFilter === f.id
                ? "bg-white text-gray-900 shadow-md"
                : "bg-white/10 text-white border border-white/10"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

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
                        className="flex items-start gap-4 cursor-pointer p-3 rounded-2xl transition-all duration-700 relative overflow-hidden group mb-1 active:bg-gray-50 dark:active:bg-white/5"
                        onClick={() => navigate(`/receipt/${tx.id}?type=${tx.type}&role=${tx.role}`)}
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
                              <span className={`font-black whitespace-nowrap block ${tx.role === TransactionRole.PAYER ? "theme-text-main" : "text-green-600"} ${tx.amount.toString().split(".")[0].length > 5 ? "text-[10px]" : "text-sm"}`}>
                                {tx.role === TransactionRole.PAYER ? "-" : "+"} {tx.amount.toLocaleString(language === "ht" ? "ht-HT" : "fr-HT")} {t("currency.symbol")}
                              </span>
                            </div>
                          </div>
                          <p className="theme-text-secondary text-xs truncate mt-0.5">
                            {tx.description}
                          </p>
                          <p className="theme-text-secondary text-[10px] opacity-60 mt-0.5">
                            {new Date(tx.date).toLocaleTimeString(language === "ht" ? "ht-HT" : "fr-HT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ))}

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
                  <Landmark size={40} />
                </div>
                <p className="theme-text-secondary opacity-50 italic text-sm">
                  {t("banks.no_external_history")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BankHistory;
