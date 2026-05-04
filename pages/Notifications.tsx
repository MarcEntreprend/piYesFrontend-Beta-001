// pages/Notifications.tsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  Gift,
  CreditCard,
  QrCode,
  Info,
  Bell,
  CheckCheck,
  RefreshCw,
  CalendarClock,
  Trash2,
  X,
  Plus,
  ArrowDown,
  Check,
} from "lucide-react";
import { useTranslation, useToast } from "../App";
import { useNotifications } from "../hooks/useNotifications";
import { Notification } from "../services/notificationService";
import PageHeader from "../components/PageHeader";
import { useNotificationContext } from "../contexts/NotificationContext";
import { displayMoney } from "../shared/money";

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const {
    notifications,
    loading,
    markAllRead,
    markRead,
    unreadCount,
    refresh,
  } = useNotificationContext();

  // Selection mode states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper pour obtenir le montant formaté (ou null)
  const getFormattedAmountForNotif = (notif: Notification): string | null => {
    let rawAmount = notif.amount ?? notif.data?.amount;
    if (!rawAmount) return null;
    let numericAmount: number | null = null;
    if (typeof rawAmount === 'number') numericAmount = rawAmount;
    else if (typeof rawAmount === 'string') {
      if (rawAmount.trim().startsWith('{')) return null;
      numericAmount = parseFloat(rawAmount);
    }
    if (numericAmount === null || isNaN(numericAmount)) return null;
    return displayMoney(numericAmount * 100);
  };

  // Helper pour formater les montants dans le texte (ex: "789.98" -> "789,98")
  const formatAmountInText = (text: string): string => {
    return text.replace(/\b(\d+(?:\.\d+)?)\b/g, (match) => {
      if (match.includes('.')) {
        return match.replace('.', ',');
      }
      return match;
    });
  };

  // Local state for cleared notifications (UI only)
  const [clearedIds, setClearedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("piyes_cleared_notifications");
    return saved ? JSON.parse(saved) : [];
  });

  const visibleNotifications = useMemo(() => {
    return notifications.filter((n) => !clearedIds.includes(n.id));
  }, [notifications, clearedIds]);

  const handleSelectAll = () => {
    const allIds = visibleNotifications.map(n => n.id);
    setSelectedIds(new Set(allIds));
  };

  const handleClearOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newCleared = [...clearedIds, id];
    setClearedIds(newCleared);
    localStorage.setItem(
      "piyes_cleared_notifications",
      JSON.stringify(newCleared),
    );
  };

  const handleClearSelected = () => {
    const idsToClear = Array.from(selectedIds);
    const newCleared = [...clearedIds, ...idsToClear];
    setClearedIds(newCleared);
    localStorage.setItem(
      "piyes_cleared_notifications",
      JSON.stringify(newCleared),
    );
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    showToast(t("common.done"), "success");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "transfer_in":
      case "transfer_received":
        return <ArrowDownLeft size={20} className="text-green-500" />;
      case "deposit_success":
        return <Plus size={20} className="text-green-500" />;
      case "withdraw_success":
        return <ArrowDown size={20} className="theme-primary-text" />;
      case "transfer_out":
        return <ArrowUpRight size={20} className="theme-primary-text" />;
      case "security":
        return <ShieldAlert size={20} className="text-orange-500" />;
      case "promo":
        return <Gift size={20} className="text-pink-500" />;
      case "card":
        return <CreditCard size={20} className="text-blue-500" />;
      case "request":
        return <QrCode size={20} className="theme-primary-text" />;
      case "scheduled_request":
      case "scheduled_created":
      case "scheduled_confirmed":
      case "scheduled_cancelled":
        return <CalendarClock size={20} className="theme-primary-text" />;
      default:
        return <Info size={20} className="theme-text-secondary" />;
    }
  };

  const handleNotifClick = (notif: Notification) => {
    console.log('[DEBUG] Notification clicked:', {
      type: notif.type,
      targetId: notif.targetId,
      dataTargetId: notif.data?.targetId,
      route: notif.data?.route,
    });

    if (isSelectionMode) {
      toggleSelection(notif.id);
      return;
    }

    markRead(notif.id);

    // Notif de demande d'ami → ouvrir page Contacts avec le contact en question
    if (notif.type === "FRIEND_REQUEST" || notif.type === "FRIEND_ACCEPTED") {
      const targetUserId = notif.data?.targetId || notif.targetId;
      if (targetUserId) {
        navigate(`/contacts?openContact=${encodeURIComponent(targetUserId)}`);
      } else {
        navigate("/contacts");
      }
      return;
    }

    // Notif rappel de paiement reçu → onglet "À régler" avec modal de confirmation
    if (notif.type === "scheduled_request") {
      const scheduleId = notif.data?.targetId || notif.targetId;
      try {
        const extra = notif.amount ? JSON.parse(notif.amount) : null;
        if (extra?.receiverUserId) {
          sessionStorage.setItem(
            "pending_contact_from_scheduler",
            JSON.stringify({
              contactUserId: extra.receiverUserId,
              name: extra.receiverName,
              tag: extra.receiverTag,
              phone: extra.receiverPhone,
              email: extra.receiverEmail,
              avatarUrl: extra.receiverAvatarUrl,
            }),
          );
        }
      } catch (e) { }
      navigate(`/scheduler?tab=outgoing&confirm=${scheduleId}`);
      return;
    }

    // Notif confirmation rappel accepté → onglet "Demandes envoyées" avec surbrillance
    if (notif.type === "scheduled_confirmed") {
      const schedId = notif.data?.targetId || notif.targetId;
      navigate(
        `/scheduler?tab=incoming${schedId ? `&highlight=${schedId}` : ""}`,
      );
      return;
    }

    // Notif rappel annulé
    if (notif.type === "scheduled_cancelled") {
      const schedId = notif.data?.targetId || notif.targetId;
      navigate(
        `/scheduler?tab=outgoing${schedId ? `&highlight=${schedId}` : ""}`,
      );
      return;
    }

    // Notif rappel créé (receiver)
    if (notif.type === "scheduled_created") {
      const schedId = notif.data?.targetId || notif.targetId;
      navigate(
        `/scheduler?tab=incoming${schedId ? `&highlight=${schedId}` : ""}`,
      );
      return;
    }

    // Notif de transaction → naviguer vers historique avec scroll + surbrillance
    const targetId = notif.data?.targetId || notif.targetId;
    const route = notif.data?.route || "/history";
    const params = new URLSearchParams();
    if (notif.data?.params) {
      Object.entries(notif.data.params).forEach(([key, val]) =>
        params.append(key, val as string),
      );
    }
    if (targetId) {
      params.append("scroll", targetId);
      params.append("highlight", targetId);
    }

    const finalUrl = params.toString()
      ? `${route}?${params.toString()}`
      : route;
    navigate(finalUrl);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000)
      return `${t("common.today")} • ${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
    return date.toLocaleDateString();
  };

  // Selection handlers
  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    if (next.size === 0) setIsSelectionMode(false);
  };

  const handleLongPressStart = (id: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setIsSelectionMode(true);
      toggleSelection(id);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="theme-card-bg min-h-screen flex flex-col pb-20">
      <PageHeader
        title={isSelectionMode
          ? t("notifications.selected_count", { count: selectedIds.size })
          : t("notifications.title")}
        subtitle={
          !isSelectionMode && unreadCount > 0
            ? t("notifications.unread_count", { count: unreadCount })
            : undefined
        }
        rightElement={
          !isSelectionMode ? (
            <div className="flex gap-1">
              <button
                onClick={refresh}
                className="p-2 theme-text-secondary hover:theme-bubble-bg rounded-full active:scale-90"
              >
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => navigate("/notifications/settings")}
                className="p-2 theme-text-secondary hover:theme-bubble-bg rounded-full transition-colors active:scale-90"
              >
                <Settings size={22} />
              </button>
            </div>
          ) : null
        }
      />

      {!isSelectionMode && (
        <div className="flex bg-gray-50/50 dark:bg-white/5 border-b theme-border">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex-1 py-3 theme-primary-text text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:bg-gray-100 dark:active:bg-white/5 transition-colors"
            >
              <CheckCheck size={14} /> {t("notifications.mark_all_read")}
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar px-6">
        {loading && notifications.length === 0 ? (
          <div className="py-6 space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 theme-bubble-bg rounded-2xl shimmer"
              ></div>
            ))}
          </div>
        ) : (
          <div className="divide-y theme-border">
            {visibleNotifications.map((notif) => {
              const formattedAmount = getFormattedAmountForNotif(notif);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleLongPressStart(notif.id);
                  }}
                  onTouchStart={() => handleLongPressStart(notif.id)}
                  onTouchEnd={handleLongPressEnd}
                  onMouseDown={() => handleLongPressStart(notif.id)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  className={`py-5 flex gap-4 active:theme-bubble-bg cursor-pointer relative group ${!notif.isRead && !isSelectionMode ? "bg-purple-50/40 dark:bg-purple-900/5 -mx-6 px-6" : ""} ${selectedIds.has(notif.id) ? "bg-(--primary-color)/10 ring-2 ring-(--primary-color) -mx-6 px-6" : ""}`}
                >
                  {!notif.isRead && !isSelectionMode && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 theme-primary-bg rounded-full shadow-[0_0_8px_var(--primary-color)]"></div>
                  )}

                  {isSelectionMode && (
                    <div className="w-6 h-6 rounded-full border-2 theme-border flex items-center justify-center shrink-0 mt-1">
                      {selectedIds.has(notif.id) && (
                        <Check size={12} className="theme-primary-text" />
                      )}
                    </div>
                  )}

                  <div className="w-11 h-11 theme-bubble-bg rounded-2xl flex items-center justify-center shrink-0 border theme-border shadow-sm group-hover:scale-105">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex justify-between items-start gap-2">
                      <h3
                        className={`text-sm leading-tight theme-text-main truncate pr-6 ${!notif.isRead ? "font-black" : "font-bold"}`}
                      >{(() => {
                        const key = `notifications.types.${notif.type}.title`;
                        const translation = t(key, {
                          ...notif.data,
                          name: notif.data?.name || notif.title,
                          amount: formattedAmount ?? notif.amount ?? notif.data?.amount,
                        });
                        if (translation === key) {
                          if (notif.type === 'transfer_out') return 'Transfert envoyé';
                          if (notif.type === 'transfer_received') return 'Transfert reçu';
                          if (notif.type === 'deposit_success') return 'Dépôt réussi';
                          return notif.title;
                        }
                        return translation;
                      })()}
                      </h3>
                      {!isSelectionMode && (
                        <button
                          onClick={(e) => handleClearOne(notif.id, e)}
                          className="absolute right-4 top-5 p-1 theme-text-secondary opacity-0 group-hover:opacity-100 hover:theme-primary-text transition-all active:scale-90"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <p className="theme-text-secondary text-xs leading-relaxed line-clamp-2">
                      {formatAmountInText(
                        t(`notifications.types.${notif.type}.body`, {
                          ...notif.data,
                          name: notif.data?.name || notif.body,
                          amount: formattedAmount ?? notif.amount ?? notif.data?.amount,
                        })
                      )}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      {(() => {
                        let rawAmount = notif.amount ?? notif.data?.amount;
                        if (!rawAmount) return null;
                        let numericAmount: number | null = null;
                        if (typeof rawAmount === 'number') numericAmount = rawAmount;
                        else if (typeof rawAmount === 'string') {
                          if (rawAmount.trim().startsWith('{')) return null;
                          numericAmount = parseFloat(rawAmount);
                        }
                        if (numericAmount === null || isNaN(numericAmount)) return null;
                        return (
                          <p className="font-black theme-text-main text-xs">
                            {displayMoney(numericAmount * 100)}
                          </p>
                        );
                      })()}
                      <p className="text-[9px] font-bold theme-text-secondary opacity-60 uppercase tracking-tighter">
                        {formatTime(notif.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && visibleNotifications.length === 0 && (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 theme-bubble-bg rounded-full flex items-center justify-center mx-auto theme-text-secondary opacity-20">
              <Bell size={48} />
            </div>
            <p className="theme-text-secondary text-sm">
              {t("notifications.empty")}
            </p>
          </div>
        )}
      </div>

      {/* Selection Bottom Bar */}
      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm theme-card-bg shadow-2xl rounded-4xl p-4 border theme-border z-100 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelSelection}
                className="p-2 theme-text-secondary active:scale-90"
              >
                <X size={20} />
              </button>
              <span className="text-xs font-bold theme-text-secondary">
                {selectedIds.size} {selectedIds.size > 1 ? t("notifications.selected_count_plural") : t("notifications.selected_count_singular")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size < visibleNotifications.length && (
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-2 text-xs font-bold theme-primary-text active:scale-95 transition-all"
                >
                  {t("notifications.select_all")}
                </button>
              )}
              <button
                onClick={handleClearSelected}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-2xl text-xs font-bold active:scale-95 transition-all"
              >
                <Trash2 size={16} /> {t("notifications.clear_selected")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;