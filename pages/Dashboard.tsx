// pages/Dashboard.tsx

import React, { useState, useEffect, useMemo, useRef } from "react";
/* Use react-router core for hooks */
import { useNavigate, useLocation } from "react-router";
import * as Icons from "lucide-react";
import logo from "../src/assets/images/logo-piyes-ppl-wh-wh-svg.svg";
import {
  Eye,
  EyeOff,
  Bell,
  User as UserIcon,
  HelpCircle,
  ChevronRight,
  Repeat,
  ShieldCheck,
  Plus,
  ArrowDownLeft,
  ArrowRightLeft,
  QrCode,
  ArrowUpRight,
  CreditCard,
  Wrench,
  Calculator,
  Search,
  MessageSquare,
  Smartphone,
  FileText,
  PlusCircle,
  PieChart as PieIcon,
  LayoutGrid,
  Users,
  History as HistoryIcon,
  Store,
  Gift,
  Globe2,
  RotateCcw,
  Globe,
  LogOut,
  X,
  RefreshCw,
  Lock,
  Zap,
  ArrowDown,
  Loader2,
} from "lucide-react";
import {
  User,
  Transaction,
  Account,
  Contact,
  ExternalBank,
  TransactionType,
  TransactionRole,
  getInitials,
} from "../shared/types";
import { useTranslation, useGlobalSync, useToast } from "../App";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../services/apiService";
import {
  getSearchIndex,
  searchInIndex,
  SearchResult,
  getRecentSearches,
  saveRecentSearch,
} from "../services/searchService";
import { useNotifications } from "../hooks/useNotifications";
import SearchResultsPanel from "../components/SearchResultsPanel";
import Modal from "../components/Modal";
import AnimatedButton from "../components/AnimatedButton";
import BankIcon from "../components/BankIcon";
import AiSupportChat from "../components/AiSupportChat";
import Button from "../components/Button";
import { useRealtimeHistory } from '../hooks/useRealtimeHistory';
import { useRealtimeBalance } from '../hooks/useRealtimeBalance';
import { displayMoney, parseMoneyInputToCents } from "../shared/money";
import { AutoScaleText } from '../components/AutoScaleText';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { unreadCount, simulatePush } = useNotifications();

  const [showSupport, setShowSupport] = useState(false);

  // Synchronisation globale via Context
  const { syncData, syncLoading, isDataStale, isRefreshing, refresh } = useGlobalSync();
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

  // 🔥 Écouter les notifications Realtime pour rafraîchir le Dashboard
  useRealtimeHistory(userId, () => {
    console.log('[Dashboard] New transaction, refreshing...');
    refresh();
  });

  // Écouter les changements de balance en temps réel
  useRealtimeBalance(userId, (newBalance) => {
    console.log('[Dashboard] Balance updated via Realtime:', newBalance);
    setLocalBalance(newBalance);
    // Optionnel : refresh le contexte pour synchroniser les autres données
    refresh();
  });

  // Écouter l'événement personnalisé pour naviguer depuis les notifs
  useEffect(() => {
    const handleRealtimeNotif = (e: CustomEvent<Notification>) => {
      const notif = e.detail;
      console.log('[Dashboard] Realtime notification clicked intent:', notif);

      // Optionnel : afficher un toast rapide
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
    };

    window.addEventListener('piyes:realtime_notification', handleRealtimeNotif as EventListener);
    return () => window.removeEventListener('piyes:realtime_notification', handleRealtimeNotif as EventListener);
  }, []);

  const [showBalance, setShowBalance] = useState(() => {
    const saved = localStorage.getItem("piyes_show_balance");
    return saved === null ? true : saved === "true";
  });
  // État local pour la balance (met à jour instantanément)
  const [localBalance, setLocalBalance] = useState<number | null>(null);

  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  // Bank Management States
  const [showAddBank, setShowAddBank] = useState(false);
  const [availableBanks, setAvailableBanks] = useState<ExternalBank[]>([]);
  const [selectedBankToLink, setSelectedBankToLink] =
    useState<ExternalBank | null>(null);
  const [linkCredentials, setLinkCredentials] = useState({
    username: "",
    password: "",
  });
  const [isLinking, setIsLinking] = useState(false);
  const [showManageBanks, setShowManageBanks] = useState(false);
  const [bankSearchTerm, setBankSearchTerm] = useState("");

  // Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchIndex = useMemo(() => getSearchIndex(t), [t]);
  const searchResults = useMemo(
    () => searchInIndex(searchTerm, searchIndex),
    [searchTerm, searchIndex],
  );
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Pull-to-Refresh States
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [isRefreshingPull, setIsRefreshingPull] = useState(false);
  const PULL_THRESHOLD = 80; // seuil en pixels
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Promotion Carousel States
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const promos = useMemo(
    () => [
      {
        id: "promo-1",
        title: t("promos.banner.title"),
        desc: t("promos.banner.desc"),
        icon: <Zap size={28} />,
        route: "/promotions",
        color: "theme-primary-bg",
        textColor: "text-white",
      },
      {
        id: "refer-earn",
        title: t("promos.items.refer_earn.title"),
        desc: t("promos.items.refer_earn.desc"),
        icon: <Icons.Share2 size={28} />,
        route: "/promotions#refer-earn",
        color: "bg-purple-600",
        textColor: "text-white",
      },
      {
        id: "welcome",
        title: t("promos.items.welcome.title"),
        desc: t("promos.items.welcome.desc"),
        icon: <Icons.Sparkles size={28} />,
        route: "/promotions",
        color: "bg-amber-500",
        textColor: "text-white",
      },
      {
        id: "cashback",
        title: t("promos.items.cashback.title"),
        desc: t("promos.items.cashback.desc"),
        icon: <Icons.Ticket size={28} />,
        route: "/promotions",
        color: "bg-green-600",
        textColor: "text-white",
      },
    ],
    [t],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promos.length]);

  // Sync icon auto-hide logic
  const [showSyncIcon, setShowSyncIcon] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [accountToUnlink, setAccountToUnlink] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);
  useEffect(() => {
    if (isRefreshing) {
      setShowSyncIcon(true);
    } else {
      const timer = setTimeout(() => setShowSyncIcon(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isRefreshing]);

  // FAQ Data from translation keys (sync with HelpCenter)
  const faqs = useMemo(
    () => [
      { q: t("help_center.faqs.q1"), a: t("help_center.faqs.a1") },
      { q: t("help_center.faqs.q2"), a: t("help_center.faqs.a2") },
      { q: t("help_center.faqs.q3"), a: t("help_center.faqs.a3") },
    ],
    [t],
  );

  const filteredAvailableBanks = useMemo(() => {
    return availableBanks.filter((bank) =>
      bank.name.toLowerCase().includes(bankSearchTerm.toLowerCase()),
    );
  }, [availableBanks, bankSearchTerm]);

  // Gesture State for swipe and pull
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const SWIPE_THRESHOLD = 50;

  // Données extraites du SyncData
  const accounts = useMemo(() => {
    let baseAccounts = syncData?.accounts || [];

    // Aggressively filter out the ghost green account (#00875A, balance 0) or accounts with label 'id'
    baseAccounts = baseAccounts.filter((a) => {
      const isGhost = a.label === "id" || a.label === "";
      const isActive = a.status === "active";
      return !isGhost && isActive;
    });

    if (baseAccounts.length > 0) return baseAccounts;

    // Fallback to show piYès account immediately using user balance
    return [
      {
        id: "piyes-main",
        label: "Compte piYès",
        provider: "piyes",
        balance: user.balance / 100,
        currency: "G",
        accountNumber: user.accountNumber || "...",
        status: "active",
        color: "#830AD1",
        logoText: "P",
      } as Account,
    ];
  }, [syncData, user]);
  const history = useMemo(() => syncData?.recentHistory || [], [syncData]);
  const contacts = useMemo(() => syncData?.contacts || [], [syncData]);
  const frequentContacts = useMemo(() => {
    return [...contacts]
      .filter((c) => c.lastTransactionDate)
      .sort(
        (a, b) =>
          new Date(b.lastTransactionDate!).getTime() -
          new Date(a.lastTransactionDate!).getTime(),
      )
      .slice(0, 5);
  }, [contacts]);
  const accountIds = useMemo(
    () => [...accounts.map((a) => a.id), "all"],
    [accounts],
  );

  const activeAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId),
    [accounts, selectedAccountId],
  );

  useEffect(() => {
    if (accounts.length > 0) {
      const isValid =
        accounts.some((a) => a.id === selectedAccountId) ||
        selectedAccountId === "all";
      if (!isValid || !selectedAccountId) {
        const piyesAccount = accounts.find((a) => a.provider === "piyes");
        if (piyesAccount) {
          setSelectedAccountId(piyesAccount.id);
        } else {
          setSelectedAccountId(accounts[0].id);
        }
      }
    }
  }, [accounts, selectedAccountId]);

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  // Theme color for header background continuity
  const headerColor = useMemo(() => {
    if (selectedAccountId === "all") return "bg-gray-800";
    return "";
  }, [selectedAccountId]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user.name.split(" ")[0];
    if (hour < 12) return `Bonjour, ${name}`;
    return `Bonsoir, ${name}`;
  }, [user.name]);

  useEffect(() => {
    const checkDailyGreeting = () => {
      const lastGreeting = localStorage.getItem("piyes-last-greeting");
      const today = new Date().toDateString();

      if (lastGreeting !== today) {
        setTimeout(() => {
          showToast(`${greeting} !`, "info");
          localStorage.setItem("piyes-last-greeting", today);
        }, 1500);
      }
    };

    checkDailyGreeting();
  }, [greeting, showToast]);

  useEffect(() => {
    const handleReset = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setIsSearchFocused(false);
      setSearchTerm("");
    };

    //  Nouvel événement : switcher vers le compte piYès
    const handleSwitchToPiyes = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      const piyesAccount = accounts.find((a) => a.provider === "piyes");
      if (piyesAccount) {
        setSelectedAccountId(piyesAccount.id);
      }
      setIsSearchFocused(false);
      setSearchTerm("");
    };

    window.addEventListener("piyes:reset_home", handleReset);
    window.addEventListener("piyes:switch_to_piyes", handleSwitchToPiyes);

    return () => {
      window.removeEventListener("piyes:reset_home", handleReset);
      window.removeEventListener("piyes:switch_to_piyes", handleSwitchToPiyes);
    };
  }, [accounts]); //  accounts comme dépendance

  useEffect(() => {
    if (showAddBank) {
      api
        .getAvailableBanks()
        .then(setAvailableBanks)
        .catch((err) => {
          console.error("Failed to fetch banks:", err);
          showToast(t("common.error"), "error");
        });
    }
  }, [showAddBank, t, showToast]);

  const handleLinkBank = async () => {
    if (!selectedBankToLink) return;
    const isMonCash = selectedBankToLink.provider === "moncash";
    if (
      !linkCredentials.username ||
      (!isMonCash && !linkCredentials.password)
    ) {
      showToast(t("common.fill_all_fields"), "error");
      return;
    }
    setIsLinking(true);
    try {
      await api.linkExternalBank(selectedBankToLink.id, linkCredentials);
      await refresh();
      setShowAddBank(false);
      setSelectedBankToLink(null);
      setLinkCredentials({ username: "", password: "" });
      showToast(
        t("banks.success_msg", { bank: selectedBankToLink.name }),
        "success",
      );
    } catch (e) {
      showToast(t("common.error"), "error");
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkBank = (accountId: string) => {
    setShowManageBanks(false);
    setAccountToUnlink(accountId);
    setShowUnlinkConfirm(true);
  };

  const confirmUnlinkBank = async () => {
    if (!accountToUnlink) return;
    setIsUnlinking(true);
    try {
      await api.unlinkExternalBank(accountToUnlink);
      await refresh();
      if (selectedAccountId === accountToUnlink) setSelectedAccountId("acc1");
      showToast(t("banks.unlink_success"), "success");
    } catch (e) {
      showToast(t("common.error"), "error");
    } finally {
      setIsUnlinking(false);
      setShowUnlinkConfirm(false);
      setAccountToUnlink(null);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    // Annuler si en cours de refresh manuel
    if (isRefreshingPull) return;
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setHasTriggered(false);
    setPullDistance(0);
    setIsPulling(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current || isRefreshingPull) return;

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - touchStartPos.current.y;
    const deltaX = currentX - touchStartPos.current.x;

    // Vérifier si on est en haut de la page et que le mouvement est principalement vertical
    if (
      window.scrollY <= 0 &&
      deltaY > 0 &&
      Math.abs(deltaY) > Math.abs(deltaX) * 1.2
    ) {
      e.preventDefault(); // empêcher le scroll natif
      setIsPulling(true);
      // Appliquer une résistance logarithmique pour la distance
      let newDistance = deltaY * 0.5;
      if (newDistance > PULL_THRESHOLD) newDistance = PULL_THRESHOLD + Math.sqrt(newDistance - PULL_THRESHOLD);
      setPullDistance(Math.min(newDistance, PULL_THRESHOLD + 30));

      // Déclencher vibration au seuil
      if (newDistance >= PULL_THRESHOLD && !hasTriggered) {
        if ("vibrate" in navigator) navigator.vibrate(10);
        setHasTriggered(true);
      } else if (newDistance < PULL_THRESHOLD && hasTriggered) {
        setHasTriggered(false);
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent, zone: "header" | "body") => {
    if (!touchStartPos.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartPos.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartPos.current.y;
    touchStartPos.current = null;

    // Gestion du Pull-to-Refresh
    if (isPulling) {
      if (pullDistance >= PULL_THRESHOLD && !isRefreshingPull) {
        // Déclencher le refresh
        setIsRefreshingPull(true);
        refresh().finally(() => {
          setIsRefreshingPull(false);
          setPullDistance(0);
          setIsPulling(false);
          setHasTriggered(false);
        });
      } else {
        // Annuler, retour à zéro
        setPullDistance(0);
        setIsPulling(false);
        setHasTriggered(false);
      }
    }

    // Gestion du swipe horizontal (changement de compte) – inchangée
    if (
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaX) > SWIPE_THRESHOLD &&
      !isPulling &&
      !isRefreshingPull
    ) {
      const currentIndex = accountIds.indexOf(selectedAccountId);
      if (deltaX < 0) {
        setSelectedAccountId(accountIds[(currentIndex + 1) % accountIds.length]);
      } else {
        setSelectedAccountId(
          accountIds[(currentIndex - 1 + accountIds.length) % accountIds.length]
        );
      }
    }
  };

  const handleSearchResultClick = (result: SearchResult) => {
    saveRecentSearch(searchTerm || result.title);
    setIsSearchFocused(false);
    setSearchTerm("");
    navigate(result.route + (result.anchor ? `?scroll=${result.anchor}` : ""));
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchTerm(query);
  };

  const getTransactionIcon = (tx: Transaction) => {
    if (tx.status === "PENDING")
      return (
        <RotateCcw
          size={20}
          className="theme-text-secondary animate-spin-slow"
        />
      );

    if (tx.type === TransactionType.DEPOSIT)
      return <Plus size={20} className="text-green-600" />;
    if (tx.type === TransactionType.WITHDRAW)
      return <ArrowDown size={20} className="text-red-500" />;
    if (tx.type === TransactionType.INTERNATIONAL)
      return <Globe size={20} className="theme-primary-text" />;
    if (tx.type === TransactionType.RECHARGE)
      return <Smartphone size={20} className="theme-primary-text" />;

    if (tx.type === TransactionType.TRANSFER) {
      return tx.role === TransactionRole.PAYER ? (
        <ArrowUpRight size={20} className="theme-text-secondary" />
      ) : (
        <ArrowDownLeft size={20} className="text-green-600" />
      );
    }

    return <Repeat size={20} />;
  };

  const getActionsForAccount = (account: Account | undefined) => {
    if (!account) return [];
    if (account.provider === "piyes") {
      return [
        {
          id: "transfer",
          label: t("actions.transfer"),
          icon: <ArrowUpRight size={20} />,
          route: "/transfer",
        },
        {
          id: "intl",
          label: t("actions.international"),
          icon: <Globe2 size={20} />,
          route: "/international-transfer",
        },
        {
          id: "deposit",
          label: t("actions.deposit"),
          icon: <Plus size={20} />,
          route: "/deposit",
        },
        {
          id: "receive",
          label: t("actions.receive"),
          icon: <QrCode size={20} />,
          route: "/request-payment",
        },
        {
          id: "withdraw",
          label: t("actions.withdraw"),
          icon: <ArrowDownLeft size={20} />,
          route: "/withdraw",
        },
        {
          id: "recharge",
          label: t("recharge.title"),
          icon: <Smartphone size={20} />,
          route: "/recharge",
        },
        {
          id: "cards",
          label: t("actions.cards"),
          icon: <CreditCard size={20} />,
          route: "/cards",
        },
        {
          id: "contacts",
          label: t("actions.contacts"),
          icon: <Users size={20} />,
          route: "/contacts",
        },
        {
          id: "services",
          label: t("actions.qr_proximity"),
          icon: <LayoutGrid size={20} />,
          route: "/keys",
        },
        {
          id: "tools",
          label: t("actions.tools"),
          icon: <Calculator size={20} />,
          route: "/tools",
        },
      ];
    }

    // Actions pour banques externes
    return [
      {
        id: "history",
        label: t("actions.history"),
        icon: <HistoryIcon size={20} />,
        route: `/bank-history/${account.id}`,
      },
      {
        id: "recharge",
        label: t("recharge.title"),
        icon: <Smartphone size={20} />,
        route: `/recharge?accountId=${account.id}`,
      },
      {
        id: "inter-transfer",
        label: t("actions.transfer"),
        icon: <ArrowRightLeft size={20} />,
        route: `/inter-bank-transfer?bank=${account.id}`,
      },
      {
        id: "inter-deposit",
        label: t("actions.deposit"),
        icon: <Plus size={20} />,
        route: `/inter-bank-transfer?bank=${account.id}&mode=deposit`,
      },
    ];
  };

  // Fonction pour obtenir le titre d'affichage d'une transaction (copiée de History)
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

  return (
    <div
      ref={scrollContainerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={(e) => onTouchEnd(e, "body")}
      className="flex flex-col animate-in fade-in duration-500 pb-32 min-h-screen theme-card-bg overflow-x-hidden relative"
    >
      {/* Background Continuity Filler */}
      <div
        className={`absolute top-[-100vh] left-0 right-0 h-screen z-0 ${headerColor}`}
      ></div>

      {/*Pull-to-Refresh : icône circulaire */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200"
        style={{
          opacity: isPulling || isRefreshingPull ? 1 : 0,
          transform: `translateY(${Math.min(pullDistance * 0.6, 60)}px)`,
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-xl border theme-border">
          <RefreshCw
            size={24}
            className={`theme-primary-text transition-transform duration-75 ${isRefreshingPull ? "animate-spin" : ""
              }`}
            style={{
              transform: isRefreshingPull
                ? "rotate(0deg)"
                : `rotate(${Math.min((pullDistance / PULL_THRESHOLD) * 360, 360)}deg)`,
            }}
          />
        </div>
      </div>

      {/* Indicateur Pull-to-Refresh flottant (au-dessus de tout) */}
      {(isPulling || isRefreshingPull || pullDistance > 0) && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-9999 pointer-events-none transition-all duration-100"
          style={{
            opacity: isPulling || isRefreshingPull ? 1 : Math.min(pullDistance / 30, 0.8),
            transform: `translateY(${Math.min(pullDistance * 0.5, 50)}px)`,
          }}
        >
          <div className="theme-card-bg rounded-full p-3 shadow-2xl border theme-border backdrop-blur-md">
            <RefreshCw
              size={24}
              className={`theme-primary-text transition-all duration-75 ${isRefreshingPull ? "animate-spin" : ""
                }`}
              style={{
                transform: isRefreshingPull
                  ? "rotate(0deg)"
                  : `rotate(${Math.min((pullDistance / PULL_THRESHOLD) * 360, 360)}deg)`,
              }}
            />
          </div>
        </div>
      )}

      <SearchResultsPanel
        isOpen={isSearchFocused}
        onClose={() => setIsSearchFocused(false)}
        searchTerm={searchTerm}
        results={searchResults}
        onResultClick={handleSearchResultClick}
        recentSearches={recentSearches}
        onRecentSearchClick={handleRecentSearchClick}
        faqs={faqs}
      />

      <div
        className={`transition-all duration-500 pt-8 pb-4 px-6 space-y-4 relative ${isSearchFocused ? "z-auto" : "z-50"} ${headerColor}`}
        style={{
          backgroundColor:
            selectedAccountId !== "all"
              ? activeAccount?.color || "#830AD1"
              : undefined,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              onClick={() => navigate("/settings")}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer border border-white/20 transition-all active:scale-90 ${isSearchFocused ? "opacity-20 pointer-events-none" : ""} ${selectedAccountId === "all" ? "bg-gray-300 text-gray-700" : "bg-white/20 text-white"}`}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                getInitials(user.name)
              )}
            </div>
            {user.verificationStatus === "verified" && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                <ShieldCheck
                  size={12}
                  className="text-blue-500 fill-blue-500"
                />
              </div>
            )}
          </div>

          <div
            ref={searchContainerRef}
            className={`flex-1 transition-all duration-300 ${isSearchFocused ? "relative z-140" : ""}`}
          >
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 opacity-50 transition-colors ${isSearchFocused ? "theme-primary-text opacity-100" : selectedAccountId === "all" ? "text-gray-500" : "text-white"}`}
                size={16}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder={t("dashboard.search_placeholder")}
                className={`w-full py-2.5 pl-10 pr-10 rounded-full text-sm outline-none border transition-all duration-300 ${isSearchFocused
                  ? "bg-white text-gray-900 border-transparent shadow-2xl scale-[1.02] placeholder:text-gray-400"
                  : selectedAccountId === "all"
                    ? "theme-bubble-bg theme-text-main border-transparent placeholder:text-(--theme-text-secondary) placeholder:opacity-50"
                    : "bg-white/10 text-white border-white/10 placeholder:text-white/40"
                  }`}
              />
              {isSearchFocused && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setIsSearchFocused(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-gray-100 text-gray-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div
            className={`flex items-center gap-1 transition-opacity duration-300 ${isSearchFocused ? "opacity-20 pointer-events-none" : "opacity-100"}`}
          >
            <button
              onClick={() => setShowSupport(true)}
              className={`p-2 rounded-full ${selectedAccountId === "all" ? "theme-text-secondary" : "text-white/80"}`}
            >
              <HelpCircle size={22} />
            </button>
            <div className="relative">
              <button
                onClick={() => navigate("/notifications")}
                className={`p-2 rounded-full ${selectedAccountId === "all" ? "theme-text-secondary" : "text-white/80"} active:scale-90`}
              >
                <Bell size={22} />
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          className={`flex items-center justify-end transition-all duration-500 ${isSearchFocused ? "opacity-20" : "opacity-100"} ${selectedAccountId === "all" ? "theme-text-main" : "text-white"} hidden`}
        >
          <div
            className={`transition-all duration-500 flex items-center gap-2 ${showSyncIcon || isDataStale ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"}`}
          >
            <RefreshCw
              size={14}
              className={`opacity-60 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
              {isRefreshing ? "Sync..." : isDataStale ? "Offline" : "Ok"}
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-3 overflow-x-auto no-scrollbar py-2 transition-opacity duration-300 ${isSearchFocused ? "opacity-20" : "opacity-100"}`}
        >
          {accounts.map((acc) => (
            <AnimatedButton
              key={acc.id}
              isSelected={selectedAccountId === acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              icon={acc.logoText[0]}
              logoUrl={acc.provider === "piyes" ? logo : acc.logoUrl}
              id={acc.id}
              label={acc.label}
              accentColor={acc.color}
              inactiveBg="rgba(255,255,255,0.1)"
              inactiveText="rgba(255,255,255,0.6)"
              iconInactiveBg={`${acc.color}33`}
              showBadge={acc.provider === "moncash" && acc.isVerified}
            />
          ))}
          <AnimatedButton
            isSelected={selectedAccountId === "all"}
            onClick={() => setSelectedAccountId("all")}
            icon={<PieIcon size={14} />}
            label={t("dashboard.all_banks")}
            accentColor="#4B5563"
            activeBg="#4B5563"
            activeText="#FFFFFF"
            inactiveBg="rgba(255,255,255,0.1)"
            inactiveText="rgba(255,255,255,0.6)"
            iconInactiveBg="rgba(255,255,255,0.2)"
          />
        </div>


        {/* Stale Data Indicator — shown when offline > 10s */}
        {isDataStale && selectedAccountId !== "all" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 backdrop-blur-md rounded-xl border border-amber-500/30 animate-in fade-in duration-300">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider">
              Données non actualisées — reconnexion...
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                refresh();
              }}
              className="ml-auto p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <RefreshCw size={12} className="text-white animate-spin" />
            </button>
          </div>
        )}

        {/* Balance Card */}
        <div
          onClick={() => refresh()}
          className={`mt-4 rounded-[28px] p-6 space-y-6 transition-all duration-500 cursor-pointer active:scale-[0.99] ${isSearchFocused
            ? "opacity-10 translate-y-2"
            : isRefreshing
              ? "opacity-40 scale-[0.98]"
              : isDataStale && selectedAccountId !== "all"
                ? "opacity-70"
                : "opacity-100"
            } ${selectedAccountId === "all" ? "bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700" : "bg-white/5 backdrop-blur-md border border-white/10"}`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div
                className={`p-1 rounded-md ${selectedAccountId === "all" ? "bg-gray-100 theme-text-secondary" : "bg-white/20 text-white"}`}
              >
                <Lock size={12} />
              </div>
              <span
                className={`text-sm font-bold text-white ${selectedAccountId === "all" ? "text-white" : ""}`}
              >
                {isRefreshing ? (
                  <div className="flex items-center gap-2 animate-pulse">
                    <RefreshCw size={12} className="animate-spin" />
                    <span className="text-[10px] uppercase tracking-widest">
                      Sync...
                    </span>
                  </div>
                ) : selectedAccountId === "all" ? (
                  t("dashboard.total_balance")
                ) : (
                  t("dashboard.account")
                )}
              </span>
            </div>
            {selectedAccountId !== "all" && (
              <button
                onClick={() =>
                  navigate(
                    activeAccount?.provider === "piyes"
                      ? "/history"
                      : `/bank-history/${activeAccount?.id}`,
                  )
                }
                className={`text-xs font-bold flex items-center gap-1 text-white ${selectedAccountId === "all" ? "theme-primary-text" : ""}`}
              >
                {t("dashboard.view_history")} <ChevronRight size={14} />
              </button>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center h-10">
              <div className="font-bold text-white">
                {showBalance ? (
                  <>
                    {activeAccount?.provider === "moncash" ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm opacity-60">Solde privé non disponible</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open("tel:*202#");
                          }}
                          className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full text-xs flex items-center gap-2 transition-colors w-fit"
                        >
                          <Smartphone size={14} /> Consulter via *202#
                        </button>
                      </div>
                    ) : (
                      <AutoScaleText
                        maxFontSize={36}
                        minFontSize={16}
                        className="font-bold text-white"
                      >
                        {t("currency.symbol")} {displayMoney(
                          (selectedAccountId === "all"
                            ? totalBalance * 100
                            : (localBalance !== null && activeAccount?.provider === "piyes"
                              ? localBalance * 100
                              : (activeAccount?.balance || 0) * 100)
                          )
                        )}
                      </AutoScaleText>
                    )}
                  </>
                ) : (
                  <div className="w-32 h-8 rounded-md animate-pulse bg-white/20"></div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newValue = !showBalance;
                  setShowBalance(newValue);
                  localStorage.setItem(
                    "piyes_show_balance",
                    newValue.toString(),
                  );
                }}
                className={
                  selectedAccountId === "all"
                    ? "theme-text-secondary"
                    : "text-white"
                }
              >
                {showBalance ? <Eye size={24} /> : <EyeOff size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto no-scrollbar transition-all duration-300 ${isSearchFocused ? "blur-sm grayscale opacity-30 scale-95" : "blur-0 grayscale-0 opacity-100 scale-100"}`}
      >
        {selectedAccountId === "all" ? (
          <section className="p-6 space-y-10 animate-in slide-in-from-bottom duration-500">
            {/* Bank Management Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                onClick={() => setShowAddBank(true)}
                className="flex items-center gap-3 p-4 theme-bubble-bg rounded-2xl border theme-border active:scale-95 transition-all"
              >
                <div className="w-10 h-10 rounded-xl theme-primary-bg text-white flex items-center justify-center shadow-sm">
                  <PlusCircle size={20} />
                </div>
                <span className="text-xs font-bold theme-text-main">
                  {t("banks.add_title")}
                </span>
              </motion.button>
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => setShowManageBanks(true)}
                className="flex items-center gap-3 p-4 theme-bubble-bg rounded-2xl border theme-border active:scale-95 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-200 theme-text-secondary flex items-center justify-center shadow-sm">
                  <Wrench size={20} />
                </div>
                <span className="text-xs font-bold theme-text-main">
                  {t("banks.manage_banks")}
                </span>
              </motion.button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold theme-text-main">
                  {t("dashboard.balance_distribution")}
                </h3>
                <PieIcon
                  size={18}
                  className="theme-text-secondary opacity-40"
                />
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full flex overflow-hidden">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="h-full transition-all duration-1000"
                    style={{
                      width: `${(acc.balance / (totalBalance || 1)) * 100}%`,
                      backgroundColor: acc.color,
                    }}
                  ></div>
                ))}
              </div>
              <div className="space-y-6">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => setSelectedAccountId(acc.id)}
                  >
                    <div className="flex items-center gap-4">
                      <BankIcon
                        logoUrl={acc.logoUrl}
                        logoText={acc.logoText}
                        color={acc.color}
                        size="md"
                        className="group-hover:scale-110 transition-transform"
                      />
                      <p className="font-bold theme-text-main text-sm">
                        {acc.label}
                      </p>
                    </div>
                    <p className="text-xs theme-text-secondary font-bold">
                      {Math.round((acc.balance / (totalBalance || 1)) * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* 1. Quick Actions Grid */}
            <section className="p-6 grid grid-cols-4 gap-y-8 gap-x-2">
              <AnimatePresence mode="popLayout">
                {getActionsForAccount(activeAccount).map((action, index) => (
                  <motion.button
                    key={`${selectedAccountId}-${action.id}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      delay: index * 0.04,
                    }}
                    onClick={() => navigate(action.route)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-14 h-14 theme-bubble-bg rounded-2xl flex items-center justify-center theme-primary-text group-active:scale-90 transition-all border theme-border shadow-sm">
                      {action.icon}
                    </div>
                    <span className="text-[10px] font-bold theme-text-main text-center leading-tight">
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </section>

            {/* 2. Promotions Carousel */}
            <section className="px-6 mb-8">
              <div className="relative h-32 w-full overflow-hidden rounded-4xl">
                <AnimatePresence mode="wait">
                  <motion.button
                    key={promos[currentPromoIndex].id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    onClick={() => navigate(promos[currentPromoIndex].route)}
                    className={`absolute inset-0 w-full h-full ${promos[currentPromoIndex].color} p-6 flex items-center gap-5 active:scale-[0.98] transition-all overflow-hidden group shadow-sm`}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <Gift
                        size={80}
                        className={promos[currentPromoIndex].textColor}
                      />
                    </div>
                    <div
                      className={`w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-sm border border-white/30 shrink-0 ${promos[currentPromoIndex].textColor}`}
                    >
                      {promos[currentPromoIndex].icon}
                    </div>
                    <div className="flex-1 text-left space-y-0.5">
                      <h4
                        className={`font-black text-sm uppercase tracking-tight ${promos[currentPromoIndex].textColor}`}
                      >
                        {promos[currentPromoIndex].title}
                      </h4>
                      <p
                        className={`text-[10px] font-medium opacity-80 line-clamp-2 ${promos[currentPromoIndex].textColor}`}
                      >
                        {promos[currentPromoIndex].desc}
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`${promos[currentPromoIndex].textColor} opacity-50`}
                    />
                  </motion.button>
                </AnimatePresence>

                {/* Carousel Indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {promos.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 rounded-full transition-all duration-300 ${idx === currentPromoIndex ? "w-4 bg-white" : "w-1 bg-white/40"}`}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* 3. Fast Contacts (Transfer Again) */}
            {activeAccount?.provider === "piyes" && (
              <section id="transfer-again" className="space-y-4 mb-8">
                <div className="px-6 flex justify-between items-center">
                  <h3 className="text-sm font-black theme-text-secondary uppercase tracking-widest">
                    {t("dashboard.transfer_again")}
                  </h3>
                  <button
                    onClick={() => navigate("/transfer-interactions")}
                    className="p-1 theme-text-secondary flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar px-6">
                  {frequentContacts.length > 0 ? (
                    frequentContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => {
                          const getPriorityKey = (c: any) => {
                            if (c.tag) return `@${c.tag.replace(/^@/, "")}`;
                            if (c.email) return c.email;
                            if (c.phone)
                              return `+${c.phone.replace(/^\+/, "")}`;
                            if (c.randomKey) return c.randomKey;
                            return c.name;
                          };
                          const priorityKey = getPriorityKey(contact);
                          navigate(
                            `/transfer?recipient=${encodeURIComponent(priorityKey)}`,
                          );
                        }}
                        className="flex flex-col items-center gap-3 min-w-20 active:scale-90 transition-transform"
                      >
                        <div className="w-16 h-16 theme-bubble-bg rounded-full border theme-border flex items-center justify-center font-bold theme-primary-text text-lg shadow-sm">
                          {contact.avatarUrl ? (
                            <img
                              src={contact.avatarUrl}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            getInitials(contact.name)
                          )}
                        </div>
                        <span className="text-[10px] font-bold theme-text-main truncate w-16 text-center">
                          {contact.name.split(" ")[0]}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="flex items-center gap-4 py-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center gap-2 opacity-20"
                        >
                          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-white/10 border-2 border-dashed border-gray-300 dark:border-white/20"></div>
                          <div className="w-10 h-2 bg-gray-200 dark:bg-white/10 rounded"></div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => navigate("/contacts")}
                    className="flex flex-col items-center gap-3 min-w-20 active:scale-90 transition-transform"
                  >
                    <div className="w-16 h-16 border-2 border-dashed theme-border rounded-full flex items-center justify-center theme-text-secondary">
                      <Plus size={24} />
                    </div>
                    <span className="text-[10px] font-bold theme-text-secondary">
                      Nouveau
                    </span>
                  </button>
                </div>
              </section>
            )}

            {/* 4. Recent Transactions */}
            <section
              id="recent-history"
              className="p-6 pt-0 space-y-6 border-t theme-border mt-4"
            >
              <div className="px-6 flex justify-between items-center">
                <h3 className="text-sm font-black theme-text-secondary uppercase tracking-widest">
                  {t("dashboard.recent_history")}
                </h3>
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => navigate("/history")}
                  className="font-bold theme-primary-text"
                >
                  {t("dashboard.see_all")}
                </Button>
              </div>
              <div className="space-y-6">
                {history.length > 0 ? (
                  history.slice(0, 3).map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() =>
                        navigate(
                          `/receipt/${tx.id}?type=${tx.type}&role=${tx.role}`,
                        )
                      }
                      className="flex items-start gap-4 active:bg-gray-50 dark:active:bg-white/5 p-2 -mx-2 rounded-xl transition-colors cursor-pointer group"
                    >
                      <div className="w-12 h-12 theme-bubble-bg rounded-full flex items-center justify-center theme-primary-text group-active:scale-105 transition-transform shrink-0">
                        {getTransactionIcon(tx)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <p className="font-bold theme-text-main text-sm leading-tight truncate">
                            {tx.counterpartyName}
                          </p>
                          <div className="shrink-0 text-right w-25">
                            <span
                              className={`font-black whitespace-nowrap block ${tx.role.toLowerCase() === "payer" ? "theme-text-main" : "text-green-600"} ${tx.amount.toString().split(".")[0].length > 5 ? "text-[10px]" : "text-sm"}`}
                            >
                              {tx.role.toLowerCase() === "payer" ? "-" : "+"}{" "}
                              {tx.amount.toLocaleString(
                                language === "ht" ? "ht-HT" : "fr-HT",
                              )}{" "}
                              {t("currency.symbol")}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] theme-text-secondary truncate mt-0.5">
                          {getTransactionTitle(tx)}
                        </p>
                        <p className="text-[10px] theme-text-secondary opacity-60 mt-0.5">
                          {new Date(tx.date).toLocaleDateString("fr-HT")} •{" "}
                          {new Date(tx.date).toLocaleTimeString("fr-HT", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center space-y-4 opacity-40">
                    <div className="w-16 h-16 theme-bubble-bg rounded-full flex items-center justify-center mx-auto">
                      <Repeat size={24} className="theme-text-secondary" />
                    </div>
                    <p className="text-sm font-bold theme-text-secondary italic">
                      Aucune transaction pour le moment
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Add Bank Modal */}
      <Modal
        isOpen={showAddBank}
        onClose={() => {
          setShowAddBank(false);
          setSelectedBankToLink(null);
          setBankSearchTerm("");
          setLinkCredentials({ username: "", password: "" });
        }}
      >
        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <h3 className="text-2xl font-black theme-text-main tracking-tight">
              {selectedBankToLink?.provider === "moncash"
                ? t("banks.verify_title_moncash")
                : t("banks.add_title")}
            </h3>
            <p className="text-sm theme-text-secondary">
              {selectedBankToLink?.provider === "moncash"
                ? t("banks.verify_sub_moncash")
                : t("banks.add_sub")}
            </p>
          </div>

          {!selectedBankToLink ? (
            <div className="space-y-4">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-secondary"
                  size={18}
                />
                <input
                  type="text"
                  placeholder={t("common.search")}
                  value={bankSearchTerm}
                  onChange={(e) => setBankSearchTerm(e.target.value)}
                  className="w-full py-4 pl-12 pr-4 theme-bubble-bg rounded-2xl outline-none theme-text-main border theme-border focus:border-(--primary-color) transition-all font-bold"
                />
              </div>

              <div className="space-y-3 max-h-100 overflow-y-auto no-scrollbar">
                <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                  {t("banks.select_bank")}
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {filteredAvailableBanks.map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => setSelectedBankToLink(bank)}
                      className="flex items-center justify-between p-5 theme-bubble-bg rounded-[28px] border theme-border active:scale-[0.98] transition-all hover:border-(--primary-color)"
                    >
                      <div className="flex items-center gap-4">
                        <BankIcon
                          logoUrl={bank.logoUrl}
                          logoText={bank.name}
                          color={bank.color}
                          size="md"
                        />
                        <span className="font-bold theme-text-main">
                          {bank.name}
                        </span>
                      </div>
                      <ChevronRight
                        size={18}
                        className="theme-text-secondary opacity-30"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <button
                onClick={() => setSelectedBankToLink(null)}
                className="flex items-center gap-2 text-xs font-bold theme-primary-text"
              >
                <ArrowDown className="rotate-90" size={14} /> {t("common.back")}
              </button>

              <div className="flex items-center gap-4 p-4 theme-bubble-bg rounded-2xl border theme-border">
                <BankIcon
                  logoUrl={selectedBankToLink.logoUrl}
                  logoText={selectedBankToLink.name}
                  color={selectedBankToLink.color}
                  size="lg"
                />
                <div>
                  <p className="font-black theme-text-main">
                    {selectedBankToLink.name}
                  </p>
                  <p className="text-[10px] font-bold theme-text-secondary uppercase tracking-widest">
                    {selectedBankToLink.provider === "moncash"
                      ? t("banks.credentials_title_moncash")
                      : t("banks.credentials_title")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                    {selectedBankToLink.provider === "moncash"
                      ? t("banks.username_moncash")
                      : t("banks.username")}
                  </label>
                  <input
                    type="text"
                    value={linkCredentials.username}
                    onChange={(e) =>
                      setLinkCredentials((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    className="w-full p-5 theme-bubble-bg rounded-[28px] outline-none theme-text-main border theme-border focus:border-(--primary-color) transition-all font-bold"
                    placeholder={
                      selectedBankToLink.provider === "moncash" ? "509..." : ""
                    }
                  />
                </div>
                {selectedBankToLink.provider !== "moncash" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                      {t("banks.password")}
                    </label>
                    <input
                      type="password"
                      value={linkCredentials.password}
                      onChange={(e) =>
                        setLinkCredentials((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="w-full p-5 theme-bubble-bg rounded-[28px] outline-none theme-text-main border theme-border focus:border-(--primary-color) transition-all font-bold"
                      placeholder="••••"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleLinkBank}
                  isLoading={isLinking}
                  className="py-4 rounded-2xl font-bold shadow-lg"
                >
                  {selectedBankToLink.provider === "moncash"
                    ? t("banks.btn_verify_moncash")
                    : t("banks.btn_link")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirmation Modal for Unlinking Bank */}
      <Modal
        isOpen={showUnlinkConfirm}
        onClose={() => !isUnlinking && setShowUnlinkConfirm(false)}
      >
        <div className="p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <LogOut size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold theme-text-main">
              {t("banks.unlink_confirm_title")}
            </h3>
            <p className="text-sm theme-text-secondary">
              {t("banks.unlink_confirm_desc")}
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="danger"
              fullWidth
              onClick={confirmUnlinkBank}
              isLoading={isUnlinking}
              className="py-4 rounded-2xl font-bold shadow-lg"
            >
              {t("banks.confirm_unlink")}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowUnlinkConfirm(false)}
              disabled={isUnlinking}
              className="py-4 rounded-2xl font-bold"
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manage Banks Modal */}
      <Modal isOpen={showManageBanks} onClose={() => setShowManageBanks(false)}>
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black theme-text-main tracking-tight">
              {t("banks.manage_banks")}
            </h3>
            <Button
              variant="utility"
              size="sm"
              onClick={() => setShowManageBanks(false)}
              className="p-2 theme-bubble-bg rounded-full theme-text-secondary"
              leftIcon={<X size={20} />}
            />
          </div>

          <div className="space-y-4">
            {accounts
              .filter((a) => a.provider !== "piyes")
              .map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-5 theme-bubble-bg rounded-[28px] border theme-border"
                >
                  <div className="flex items-center gap-4">
                    <BankIcon
                      logoUrl={acc.logoUrl}
                      logoText={acc.logoText}
                      color={acc.color}
                      size="md"
                    />
                    <div>
                      <p className="font-bold theme-text-main">{acc.label}</p>
                      <p className="text-[10px] theme-text-secondary">
                        {acc.accountNumber}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnlinkBank(acc.id)}
                    className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-colors"
                  >
                    <Icons.Trash2 size={20} />
                  </button>
                </div>
              ))}
            {accounts.filter((a) => a.provider !== "piyes").length === 0 && (
              <p className="text-center theme-text-secondary italic text-sm py-10">
                Aucune banque liée.
              </p>
            )}
          </div>
        </div>
      </Modal>
      <AiSupportChat
        isOpen={showSupport}
        onClose={() => setShowSupport(false)}
        context={t("actions.dashboard")}
      />
    </div>
  );
};

export default Dashboard;
