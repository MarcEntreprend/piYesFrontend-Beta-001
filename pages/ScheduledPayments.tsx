//pages/ScheduledPayments.tsx

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  Settings2,
  Trash2,
  X,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  AlertCircle,
  Plus,
  Filter,
  CalendarClock,
  Loader2,
} from "lucide-react";
import { useTranslation } from "../App";
import { useToast } from "../App";
import Modal from "../components/Modal";
import { api } from "../services/apiService";
import {
  Contact,
  ScheduledPayment as SP,
  ReminderSlot,
  User,
} from "../shared/types";
import SearchInput from "../components/SearchInput";
import ScheduledPaymentItem from "../components/ScheduledPaymentItem";
import SegmentedControl from "../components/SegmentedControl";
import { HighlightedItem, useHighlight } from '../components/HighlightedItem';
import { displayMoney } from "../shared/money";

type SchedulerTab = "outgoing" | "incoming";

export interface ScheduledPayment {
  id: string;
  title: string;
  counterparty: string;
  amount: number;
  dueDate: string;
  status: "pending" | "confirmed" | "paid" | "cancelled";
  type: "incoming" | "outgoing";
}

const ScheduledPayments: React.FC = () => {
  const { t, language } = useTranslation();
  const { highlight } = useHighlight();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  const [activeTab, setActiveTab] = useState<SchedulerTab>("incoming");
  // Swipe between tabs
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const tabs: SchedulerTab[] = ["outgoing", "incoming"];

  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null); // item déployé depuis URL ?openItem=

  // Modal confirmation suppression groupe
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Modal confirmation rappel côté payeur (via lien/QR)
  const [confirmSchedule, setConfirmSchedule] = useState<any>(null);
  const [confirmPin, setConfirmPin] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Surbrillance depuis notification
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // IDs des annulés en cours de "grace period" (affichés 30s avant disparition)
  const [fadingOutIds, setFadingOutIds] = useState<Set<string>>(new Set());

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "outgoing" || tab === "incoming") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Charger depuis l'API
  const [payments, setPayments] = useState<ScheduledPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Clé pour le cache localStorage
  const SCHEDULER_CACHE_KEY = "piyes_scheduler_cache";

  // Sauvegarder les paiements dans le cache
  const savePaymentsToCache = (paymentsData: ScheduledPayment[], userId: string, userData: User | null) => {
    try {
      const cacheData = {
        payments: paymentsData,
        currentUserId: userId,
        currentUser: userData,
        timestamp: Date.now(),
        expiry: Date.now() + 5 * 60 * 1000, // 5 minutes
      };
      localStorage.setItem(SCHEDULER_CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.error("Failed to save scheduler cache", e);
    }
  };

  // Charger les paiements depuis le cache
  const loadPaymentsFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(SCHEDULER_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.expiry > Date.now()) {
          setPayments(data.payments);
          setCurrentUserId(data.currentUserId);
          setCurrentUser(data.currentUser);
          setLoadingPayments(false);
          return true;
        }
      }
    } catch (e) {
      console.error("Failed to load scheduler cache", e);
    }
    return false;
  }, []);

  // Charger depuis l'API (avec mise à jour du cache)
  const loadPayments = useCallback(async (forceRefresh = false) => {
    // Si pas forcé, essayer le cache d'abord
    if (!forceRefresh && loadPaymentsFromCache()) {
      // Rafraîchir en arrière-plan sans bloquer l'UI
      refreshPaymentsInBackground();
      return;
    }

    setLoadingPayments(true);
    try {
      const [data, sync] = await Promise.all([
        api.getScheduledPaymentsFresh(),
        api.sync(),
      ]);
      setPayments(data);
      setCurrentUserId(sync.user.id);
      setCurrentUser(sync.user);
      savePaymentsToCache(data, sync.user.id, sync.user);
    } catch (e) {
      console.error("Failed to load scheduled payments", e);
    }
    setLoadingPayments(false);
  }, [loadPaymentsFromCache]);

  // Rafraîchissement en arrière-plan (silencieux)
  const refreshPaymentsInBackground = useCallback(async () => {
    try {
      const [data, sync] = await Promise.all([
        api.getScheduledPaymentsFresh(),
        api.sync(),
      ]);
      setPayments(data);
      setCurrentUserId(sync.user.id);
      setCurrentUser(sync.user);
      savePaymentsToCache(data, sync.user.id, sync.user);
    } catch (e) {
      console.error("Background refresh failed", e);
    }
  }, []);

  useEffect(() => {
    loadPayments(false); // false = utiliser le cache si disponible
  }, [loadPayments]);

  // Déterminer l'onglet à ouvrir par défaut après chargement des données
  useEffect(() => {
    // Attendre que les paiements soient chargés
    if (loadingPayments) return;

    // Si un onglet est forcé par l'URL, ne pas modifier
    const urlTab = searchParams.get("tab");
    if (urlTab === "outgoing" || urlTab === "incoming") return;

    // Compter les items "confirmed" (non payés, non reçus) dans chaque onglet
    const outgoingConfirmedCount = payments.filter(
      (p) => p.type === "outgoing" && p.status === "confirmed"
    ).length;

    const incomingConfirmedCount = payments.filter(
      (p) => p.type === "incoming" && p.status === "confirmed"
    ).length;

    // Règles :
    // 1. Si un seul onglet a des confirmed → ouvrir celui-ci
    // 2. Si les deux ont des confirmed → ouvrir "outgoing" (to_pay)
    // 3. Si aucun confirmed → ouvrir "incoming" (sent)
    if (outgoingConfirmedCount > 0 && incomingConfirmedCount === 0) {
      setActiveTab("outgoing");
    } else if (outgoingConfirmedCount === 0 && incomingConfirmedCount > 0) {
      setActiveTab("incoming");
    } else if (outgoingConfirmedCount > 0 && incomingConfirmedCount > 0) {
      setActiveTab("outgoing");
    } else {
      // Aucun confirmed
      setActiveTab("incoming");
    }
  }, [payments, loadingPayments, searchParams]);

  // Polling toutes les 10s — détecte les confirmations en temps réel (côté receiver)
  useEffect(() => {
    // Référence locale pour comparer les statuts entre deux cycles
    let prevPayments: typeof payments = [];

    const interval = setInterval(async () => {
      try {
        const data = await api.getScheduledPaymentsFresh();

        // Détecter les items qui viennent de passer pending → confirmed
        data.forEach((newItem) => {
          const old = prevPayments.find((p) => p.id === newItem.id);
          if (
            old &&
            old.status === "pending" &&
            newItem.status === "confirmed" &&
            newItem.type === "incoming"
          ) {
            // Toast de confirmation
            showToast(
              `✓ ${newItem.counterparty} ${t("scheduler.popup.confirmed_body_short", { amount: newItem.amount.toLocaleString("fr-HT") })}`,
              "success",
            );
            // Surbrillance de l'item dans la liste
            setHighlightedId(newItem.id);
            setActiveTab("incoming");
            setTimeout(() => {
              const el = document.getElementById(`schedule-item-${newItem.id}`);
              if (el)
                el.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => setHighlightedId(null), 2500);
            }, 300);
          }
        });

        prevPayments = data;
        setPayments(data);

        // Sauvegarder dans le cache localStorage
        savePaymentsToCache(data, currentUserId, currentUser);
      } catch {
        /* silently ignore */
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [t, showToast]);

  // Surbrillance de l'item ciblé par notification
  useEffect(() => {
    const targetId = searchParams.get("highlight");
    if (targetId) {
      setHighlightedId(targetId);
      setTimeout(() => {
        highlight(`schedule-item-${targetId}`);
      }, 400);
    }
  }, [searchParams, highlight]);

  // Ouvrir un item spécifique depuis l'URL (ex: retour depuis TransferFlow)
  useEffect(() => {
    const openItem = searchParams.get("openItem");
    if (openItem) {
      setExpandedId(openItem);
      setTimeout(() => {
        const el = document.getElementById(`schedule-item-${openItem}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [searchParams]);

  const fetchContacts = async () => {
    const data = await api.getContacts();
    setContacts(data);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const currentIndex = tabs.indexOf(activeTab);

    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0 && currentIndex > 0) {
        // Swipe droite → onglet précédent
        setActiveTab(tabs[currentIndex - 1]);
      } else if (deltaX < 0 && currentIndex < tabs.length - 1) {
        // Swipe gauche → onglet suivant
        setActiveTab(tabs[currentIndex + 1]);
      }
    }
    setTouchStartX(null);
  };

  // Filtrer en excluant les annulés (ou ceux en grace period qui fadent)
  const filteredPayments = useMemo(() => {
    return payments.filter(
      (p) =>
        p.type === activeTab &&
        p.status !== "cancelled" &&
        (p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.counterparty.toLowerCase().includes(searchTerm.toLowerCase())),
    );
  }, [payments, activeTab, searchTerm]);

  const stats = useMemo(() => {
    const relevant = payments.filter(
      (p) => p.type === activeTab && p.status !== "cancelled" && p.status !== "pending",
    );

    if (activeTab === "outgoing") {
      // Total à payer = confirmed uniquement (ce qui reste à payer)
      const totalToPay = relevant
        .filter((p) => p.status === "confirmed")
        .reduce((acc, p) => acc + p.amount, 0);
      const alreadyPaid = relevant
        .filter((p) => p.status === "paid")
        .reduce((acc, p) => acc + p.amount, 0);
      return {
        total: totalToPay,
        paidAmount: alreadyPaid,
      };
    }

    // Incoming : Total à recevoir = confirmed uniquement (ce qui reste à recevoir)
    const totalToReceive = relevant
      .filter((p) => p.status === "confirmed")
      .reduce((acc, p) => acc + p.amount, 0);
    const alreadyReceived = relevant
      .filter((p) => p.status === "paid")
      .reduce((acc, p) => acc + p.amount, 0);
    return {
      total: totalToReceive,        // ce qui reste à recevoir (confirmed)
      paidAmount: alreadyReceived,  // déjà reçu (paid)
    };
  }, [payments, activeTab]);

  // Compteurs tabs — exclure cancelled ET paid
  const outgoingCount = useMemo(
    () =>
      payments.filter(
        (p) =>
          p.type === "outgoing" &&
          p.status !== "cancelled" &&
          p.status !== "paid",
      ).length,
    [payments],
  );

  const incomingCount = useMemo(
    () =>
      payments.filter(
        (p) =>
          p.type === "incoming" &&
          p.status !== "cancelled" &&
          p.status !== "paid",
      ).length,
    [payments],
  );

  // Ouvrir modal de confirmation si URL contient ?confirm=<id>
  useEffect(() => {
    const confirmId = searchParams.get("confirm");
    if (!confirmId) return;
    // Charger les infos du rappel via le token ou l'id
    api
      .getScheduleByToken(confirmId)
      .catch(() => null)
      .then((data) => {
        if (data) {
          setConfirmSchedule(data);
          setShowConfirmModal(true);
        }
      });
  }, [searchParams]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    if (next.size === 0) setIsSelectionMode(false);
  };

  const handleLongPress = (id: string) => {
    setIsSelectionMode(true);
    toggleSelection(id);
  };

  // ── Supprimer définitivement un rappel (hard delete) ───────────────────────
  const handleCancelPayment = async (id: string) => {
    try {
      await api.cancelScheduledPayment(id);
      // Grace period : afficher 30s avant de retirer de la liste
      setFadingOutIds((prev) => new Set([...prev, id]));
      setTimeout(() => {
        setPayments((prev) => prev.filter((p) => p.id !== id));
        setFadingOutIds((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
      }, 30000);
    } catch (e) {
      alert(t("scheduler.errors.delete_failed"));
    }
  };

  // ── Supprimer une sélection en groupe ─────────────────────────────────────
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(
        [...selectedIds].map((id) => api.cancelScheduledPayment(id)),
      );
      const ids = new Set(selectedIds);
      // Grace period 30s
      setFadingOutIds((prev) => new Set([...prev, ...ids]));
      setTimeout(() => {
        setPayments((prev) => prev.filter((p) => !ids.has(p.id)));
        setFadingOutIds((prev) => {
          const n = new Set(prev);
          ids.forEach((id) => n.delete(id));
          return n;
        });
      }, 30000);
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      setShowDeleteModal(false);
    } catch (e) {
      alert(t("scheduler.errors.bulk_delete_failed"));
    }
  };

  // ── handleCancelSelected devient l'ouverture du modal de confirmation ──────
  const handleCancelSelected = () => {
    if (selectedIds.size === 0) return;
    setShowDeleteModal(true);
  };

  const handleRemindersUpdate = (id: string, reminders: ReminderSlot[]) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, reminders } : p)),
    );
  };

  const handleConfirmSchedule = async () => {
    if (!confirmSchedule || confirmPin.length < 4) return;
    setConfirmLoading(true);
    try {
      const pinOk = await api.verifyPin(confirmPin);
      if (!pinOk) {
        alert(t("otp.error_invalid"));
        setConfirmLoading(false);
        return;
      }

      await api.confirmScheduledPayment(
        confirmSchedule.qrToken || confirmSchedule.id,
      );
      setConfirmPin("");
      setShowConfirmModal(false);

      // Forcer refresh pour voir le nouvel item outgoing immédiatement
      const data = await api.getScheduledPaymentsFresh();
      setPayments(data);
      savePaymentsToCache(data, currentUserId, currentUser);

      // Trouver le nouvel item outgoing confirmé pour le mettre en surbrillance
      // On cherche par receiverUserId pour être précis plutôt que par nom
      const newOutgoing = data.find(
        (p: any) =>
          p.type === "outgoing" &&
          p.status === "confirmed" &&
          (p.receiverUserId === confirmSchedule.receiver?.id ||
            p.counterparty === confirmSchedule.receiver?.name),
      );

      // Basculer vers l'onglet "À régler" et surbrillance
      setActiveTab("outgoing");
      if (newOutgoing) {
        setHighlightedId(newOutgoing.id);
        setTimeout(() => {
          const el = document.getElementById(`schedule-item-${newOutgoing.id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => setHighlightedId(null), 2500);
        }, 300);
      }

      showToast(t("scheduler.success.confirmed"), "success");
    } catch (e: any) {
      alert(e?.message || t("scheduler.errors.confirm_failed"));
    }
    setConfirmLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="bg-amber-50 text-amber-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-amber-100">
            {t("scheduler.list.status.pending")}
          </span>
        );
      case "confirmed":
        return (
          <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-blue-100">
            {t("scheduler.list.status.confirmed")}
          </span>
        );
      case "paid":
        return (
          <span className="bg-green-50 text-green-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-green-100">
            {t("scheduler.list.status.paid")}
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-gray-50 text-gray-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-gray-100">
            {t("scheduler.list.status.cancelled")}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="theme-card-bg min-h-screen flex flex-col pb-32">
      <header className="px-6 pt-12 pb-2 theme-card-bg sticky top-0 z-30 border-b theme-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                isSelectionMode
                  ? (setIsSelectionMode(false), setSelectedIds(new Set()))
                  : navigate(-1)
              }
              className="p-2 -ml-2 theme-text-secondary active:scale-90 transition-transform"
            >
              {isSelectionMode ? <X size={24} /> : <ArrowLeft size={24} />}
            </button>

            <h1 className="text-xl font-bold theme-text-main">
              {isSelectionMode
                ? t("scheduler.list.selected_count", {
                  count: selectedIds.size,
                })
                : t("scheduler.title")}
            </h1>
          </div>

          {!isSelectionMode && (
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/scheduler/create")}
                className="p-2 theme-text-secondary active:scale-90 transition-transform"
              >
                <Plus size={20} />
              </button>
            </div>
          )}
        </div>

        {!isSelectionMode && (
          <div className="pb-4 px-1">
            <SegmentedControl
              options={[
                {
                  id: "outgoing",
                  label: t("scheduler.tabs.to_pay"),
                  badge:
                    outgoingCount > 0
                      ? outgoingCount > 9
                        ? "9+"
                        : outgoingCount
                      : undefined,
                },
                {
                  id: "incoming",
                  label: t("scheduler.tabs.sent"),
                  badge:
                    incomingCount > 0
                      ? incomingCount > 9
                        ? "9+"
                        : incomingCount
                      : undefined,
                },
              ]}
              value={activeTab}
              onChange={(val) => setActiveTab(val as SchedulerTab)}
              className="flex gap-3"
            />
          </div>
        )}
      </header>

      <div
        className="flex-1 animate-in fade-in duration-500 overflow-y-auto no-scrollbar"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {!isSelectionMode && (
          <div className="mx-4 mt-4 mb-6 rounded-3xl theme-card-bg border theme-border overflow-hidden shadow-sm">
            <div className="p-5 space-y-5">

              {/* Ligne des montants */}
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                    {activeTab === "outgoing"
                      ? t("scheduler.stats.to_pay")
                      : t("scheduler.stats.to_receive")}
                  </p>
                  <h2 className="text-3xl font-black theme-text-main tracking-tight">
                    {displayMoney(stats.total * 100)}
                    <span className="text-sm font-bold theme-text-secondary ml-1">
                      {t("currency.symbol")}
                    </span>
                  </h2>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                    {activeTab === "outgoing" ? t("scheduler.stats.paid") : t("scheduler.stats.received")}
                  </p>
                  <p className="text-xl font-black text-green-600">
                    {displayMoney(stats.paidAmount * 100)}
                    <span className="text-xs font-bold text-green-400 ml-1">
                      {t("currency.symbol")}
                    </span>
                  </p>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="relative">
                <div className="h-2 w-full theme-bubble-bg rounded-full overflow-hidden">
                  <div
                    className="h-full theme-primary-bg rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(131,10,209,0.5)]"
                    style={{
                      width: `${(stats.paidAmount / ((stats.total + stats.paidAmount) || 1)) * 100}%`,
                    }}
                  />
                </div>
                <div className="absolute -top-5 right-0">
                  <span className="text-[9px] font-black theme-primary-text opacity-70">
                    {Math.round((stats.paidAmount / ((stats.total + stats.paidAmount) || 1)) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4 space-y-2">
          <div className="mb-6">
            <SearchInput
              contacts={contacts}
              onSelect={(user) => setSearchTerm(user.name || "")}
              onQueryChange={setSearchTerm}
              placeholder={t("scheduler.list.search_placeholder")}
              currentUser={currentUser}
            />
          </div>

          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <HighlightedItem
                key={payment.id}
                id={`schedule-item-${payment.id}`}
                highlightDuration={2500}
                scrollBehavior="smooth"
                scrollBlock="center"
              >
                <div
                  className={fadingOutIds.has(payment.id) ? "opacity-40 pointer-events-none transition-opacity duration-1000" : ""}
                >
                  <ScheduledPaymentItem
                    payment={payment}
                    currentUserId={currentUserId}
                    onCancel={handleCancelPayment}
                    onRemindersUpdate={handleRemindersUpdate}
                    onRefresh={loadPayments}
                    isSelected={selectedIds.has(payment.id)}
                    isSelectionMode={isSelectionMode}
                    onSelect={toggleSelection}
                    onLongPress={handleLongPress}
                    highlighted={highlightedId === payment.id}
                    defaultExpanded={expandedId === payment.id}
                  />
                </div>
              </HighlightedItem>
            ))}

            {filteredPayments.length === 0 && (
              <div className="py-20 flex flex-col items-center text-center space-y-4 opacity-40">
                <Calendar size={48} strokeWidth={1} />
                <p className="text-sm font-medium">
                  {t("scheduler.list.empty")}
                </p>
                <p className="text-xs theme-text-secondary max-w-50 mx-auto">
                  {activeTab === "incoming"
                    ? t("scheduler.list.empty_incoming_desc")
                    : t("scheduler.list.empty_outgoing_desc")}
                </p>
                <button
                  onClick={() => navigate("/scheduler/create")}
                  className="theme-primary-text font-bold text-xs underline"
                >
                  {t("scheduler.list.create_first")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isSelectionMode && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm theme-card-bg shadow-2xl rounded-4xl p-4 border theme-border flex items-center justify-between z-100 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2">
            {/* X pour annuler la sélection (comportement existant gardé) */}
            <button
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedIds(new Set());
              }}
              className="p-2 theme-text-secondary active:scale-90"
            >
              <X size={20} />
            </button>
            <span className="text-xs font-bold theme-text-secondary">
              {t("scheduler.list.selected_count", { count: selectedIds.size })}
            </span>
          </div>
          <div className="px-4 py-2 theme-bubble-bg rounded-2xl border theme-border">
            <p className="text-[10px] font-bold theme-primary-text">
              {t("scheduler.list.total")}{" "}
              {[...selectedIds]
                .reduce(
                  (acc, id) =>
                    acc + (payments.find((p) => p.id === id)?.amount || 0),
                  0,
                )
                .toLocaleString(t("intl.locale"))}{" "}
              {t("currency.symbol")}
            </p>
          </div>
          {/* Unique bouton "Supprimer sélection" */}
          <button
            onClick={handleCancelSelected}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-2xl text-xs font-bold active:scale-95 transition-all disabled:opacity-40"
          >
            <Trash2 size={16} /> {t("scheduler.list.delete_btn")}
          </button>
        </div>
      )}

      {!isSelectionMode && (
        <div className="px-6 py-4">
          <div className="p-4 theme-bubble-bg rounded-2xl border theme-border flex gap-3 items-start">
            <AlertCircle
              size={18}
              className="theme-primary-text shrink-0 mt-0.5"
            />
            <p className="text-[10px] theme-primary-text leading-relaxed">
              {t("scheduler.disclaimer")}
            </p>
          </div>
        </div>
      )}

      {/* ── Modal confirmation suppression groupe ───────────────────────── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        type="centered"
      >
        <div className="p-8 space-y-6 text-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <Trash2 size={28} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black theme-text-main">
              {t("scheduler.modals.delete_title")}
            </h3>
            <p className="text-xs theme-text-secondary">
              {t("scheduler.modals.delete_desc")}
            </p>
          </div>
          {/* Liste des items sélectionnés (scrollable si > 5) */}
          <div className="max-h-40 overflow-y-auto space-y-1 no-scrollbar">
            {[...selectedIds].map((id) => {
              const p = payments.find((pay) => pay.id === id);
              if (!p) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 theme-bubble-bg rounded-xl px-3 py-2 text-left"
                >
                  <span className="text-xs font-bold theme-text-main truncate">
                    {p.title}
                  </span>
                  <span className="text-[9px] theme-text-secondary shrink-0">
                    {displayMoney(p.amount * 100)} {t("currency.symbol")}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDeleteSelected}
              className="w-full py-3.5 bg-red-500 text-white rounded-2xl font-black active:scale-95 transition-all shadow-lg text-sm"
            >
              {t("scheduler.modals.confirm_delete_btn")}
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="w-full py-3 theme-text-secondary font-bold text-sm"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal confirmation rappel côté payeur ───────────────────── */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmPin("");
        }}
        type="centered"
      >
        {confirmSchedule && (
          <div className="p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <CalendarClock size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black theme-text-main">
                {t("scheduler.modals.request_title")}
              </h3>
              <p className="text-sm theme-text-secondary">
                <strong>{confirmSchedule.receiver?.name}</strong>{" "}
                {t("scheduler.modals.request_desc")}
              </p>
            </div>

            {/* Infos du rappel */}
            <div className="space-y-3 text-left theme-bubble-bg rounded-2xl p-4 border theme-border">
              <div className="flex justify-between">
                <span className="text-[10px] font-black theme-text-secondary uppercase">
                  {t("scheduler.modals.amount_label")}
                </span>
                <span className="text-sm font-black theme-text-main">
                  {displayMoney(confirmSchedule.amount * 100)}{" "}
                  {t("currency.symbol")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black theme-text-secondary uppercase">
                  {t("scheduler.modals.due_date_label")}
                </span>
                <span className="text-sm font-bold theme-text-main">
                  {confirmSchedule.dueDate
                    ? new Date(confirmSchedule.dueDate).toLocaleDateString(
                      "fr-HT",
                      { day: "numeric", month: "long" },
                    )
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black theme-text-secondary uppercase">
                  {t("scheduler.modals.reminders_label")}
                </span>
                <span className="text-sm font-bold theme-text-main">
                  {t("scheduler.modals.reminders_count", {
                    count: (confirmSchedule.reminders || []).reduce(
                      (a: number, r: any) =>
                        a + (r.time1Active ? 1 : 0) + (r.time2Active ? 1 : 0),
                      0,
                    ),
                  })}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
              <p className="text-[10px] text-amber-600 font-medium leading-relaxed">
                {t("scheduler.modals.confirm_info", {
                  name: confirmSchedule.receiver?.name,
                })}
              </p>
            </div>

            {/* PIN */}
            <div className="space-y-2">
              <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                {t("scheduler.modals.pin_prompt")}
              </p>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, ""))
                }
                placeholder={t("scheduler.modals.pin_placeholder")}
                className="w-full text-center text-3xl font-black tracking-[0.5em] theme-bubble-bg p-4 rounded-2xl border-2 border-transparent focus:border-(--primary-color) outline-none theme-text-main transition-all"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmSchedule}
                disabled={confirmPin.length < 4 || confirmLoading}
                className="w-full py-4 theme-primary-bg text-white rounded-2xl font-black active:scale-95 transition-all shadow-lg disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {confirmLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                {t("scheduler.modals.confirm_btn")}
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmPin("");
                }}
                className="w-full py-3 theme-text-secondary font-bold text-sm"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ScheduledPayments;
