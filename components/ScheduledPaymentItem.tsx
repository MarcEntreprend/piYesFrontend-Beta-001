// components/ScheduledPaymentItem.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Loader2,
  CreditCard,
  Trash2,
  Copy,
} from "lucide-react";
import { ScheduledPayment, ReminderSlot } from "../shared/types";
import { api } from "../services/apiService";
import { useToast, useTranslation } from "../App";
import { displayMoney } from "../shared/money";

interface ScheduledPaymentItemProps {
  payment: ScheduledPayment;
  currentUserId: string;
  onCancel?: (id: string) => void;
  onRemindersUpdate?: (id: string, reminders: ReminderSlot[]) => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onSelect?: (id: string) => void;
  onLongPress?: (id: string) => void;
  highlighted?: boolean;
  defaultExpanded?: boolean; // ouvrir l'item par défaut (depuis ?openItem= URL)
}

function formatDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export const ScheduledPaymentItem: React.FC<ScheduledPaymentItemProps> = ({
  payment,
  currentUserId,
  onCancel,
  onRemindersUpdate,
  isSelected = false,
  isSelectionMode = false,
  onSelect,
  onLongPress,
  highlighted = false,
  defaultExpanded = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [loadingQR, setLoadingQR] = useState(false);

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrExpiry, setQrExpiry] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState<string | null>(null); // pour recevoir l'url du qr code en cas de relance
  const [copiedLink, setCopiedLink] = useState(false);

  const { showToast } = useToast();
  // Initialiser le lien QR à partir des données existantes du payment
  useEffect(() => {
    if (payment.qrToken) {
      const link = `https://piyes.ht/schedule?token=${payment.qrToken}`;
      setQrLink(link);
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(link)}`;
      setQrUrl(url);
      setQrExpiry(payment.qrExpiresAt || null);
    }
  }, [payment.qrToken, payment.qrExpiresAt]);

  const [localReminders, setLocalReminders] = useState<ReminderSlot[]>(
    payment.reminders || [],
  );
  const [savingReminders, setSavingReminders] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false); // modal confirmation annulation individuelle

  const isReceiver = payment.type === "incoming";
  const isOutgoing = payment.type === "outgoing";
  const isPaid = payment.status === "paid";

  const activeReminderCount = localReminders.reduce(
    (acc, r) => acc + (r.time1Active ? 1 : 0) + (r.time2Active ? 1 : 0),
    0,
  );

  // ── Toggle cellule grille ────────────────────────────────────────────────
  const toggleCell = (dateStr: string, slot: "time1" | "time2") => {
    setLocalReminders((prev) => {
      const updated = prev.map((r) => {
        if (r.date !== dateStr) return r;
        const next = { ...r };
        if (slot === "time1") next.time1Active = !r.time1Active;
        else next.time2Active = !r.time2Active;
        return next;
      });
      return updated.some((r) => r.time1Active || r.time2Active)
        ? updated
        : prev;
    });
  };

  const toggleDay = (dateStr: string) => {
    setLocalReminders((prev) => {
      const daySlot = prev.find((r) => r.date === dateStr);
      if (!daySlot) return prev;
      const allActive = daySlot.time1Active && daySlot.time2Active;
      const updated = prev.map((r) =>
        r.date === dateStr
          ? { ...r, time1Active: !allActive, time2Active: !allActive }
          : r,
      );
      return updated.some((r) => r.time1Active || r.time2Active)
        ? updated
        : prev;
    });
  };

  const toggleRow = (slot: "time1" | "time2") => {
    setLocalReminders((prev) => {
      const allActive = prev.every((r) =>
        slot === "time1" ? r.time1Active : r.time2Active,
      );
      const updated = prev.map((r) =>
        slot === "time1"
          ? { ...r, time1Active: !allActive }
          : { ...r, time2Active: !allActive },
      );
      return updated.some((r) => r.time1Active || r.time2Active)
        ? updated
        : prev;
    });
  };

  // ── Sauvegarder reminders ────────────────────────────────────────────────
  const handleSaveReminders = async () => {
    setSavingReminders(true);
    try {
      await api.updateScheduledReminders(payment.id, localReminders);
      onRemindersUpdate?.(payment.id, localReminders);
    } catch (e) {
      console.error("Failed to update reminders", e);
    }
    setSavingReminders(false);
  };

  // ── Regénérer QR ─────────────────────────────────────────────────────────
  const handleRegenerateQR = async () => {
    setLoadingQR(true);
    try {
      const { qrToken, qrExpiresAt } = await api.regenerateSchedulerQR(
        payment.id,
      );
      const link = `https://piyes.ht/schedule?token=${qrToken}`;
      setQrLink(link);
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(link)}`;
      setQrUrl(url);
      setQrExpiry(qrExpiresAt);
    } catch (e) {
      console.error("Failed to regenerate QR", e);
    }
    setLoadingQR(false);
  };

  // ── Annuler le rappel : ouvrir le modal de confirmation ─────────────────
  const handleCancel = () => setShowCancelModal(true);

  const handleCancelConfirmed = async () => {
    setCancelling(true);
    setShowCancelModal(false);
    try {
      onCancel?.(payment.id);
    } catch (e: any) {
      alert(e?.message || "Erreur lors de la suppression");
    }
    setCancelling(false);
  };

  // ── Payer depuis ce rappel (payeur seulement) ────────────────────────────
  const handlePayFromReminder = async () => {
    const noteText = payment.title
      ? t("scheduler.payment_reminder_prefix", { title: payment.title })
      : t("scheduler.payment_reminder_due_prefix", {
        date: new Date(payment.dueDate).toLocaleDateString(t("intl.locale")),
      });

    const params = new URLSearchParams({
      amount: String(payment.amount),
      description: noteText,
      source: "scheduler",
      schedulerId: payment.id,
    });

    // Récupérer la clé prioritaire du receiver depuis ses contacts ou son profil
    const receiverUserId = (payment as any).receiverUserId;
    if (receiverUserId) {
      try {
        // Chercher dans les contacts locaux d'abord
        const contacts = await api.getContacts();
        const contact = contacts.find(
          (c) => c.contactUserId === receiverUserId,
        );
        if (contact) {
          // Ordre de priorité : tag > phone > email > randomKey > name
          let key = "";
          if (contact.tag) key = `@${contact.tag.replace(/^@/, "")}`;
          else if (contact.phone)
            key = contact.phone.startsWith("+")
              ? contact.phone
              : `+${contact.phone}`;
          else if (contact.email) key = contact.email;
          else if (contact.randomKey) key = contact.randomKey;
          else key = contact.name;
          params.set("recipient", key);
        } else {
          // Fallback : passer le receiverUserId pour lookup côté TransferFlow
          params.set("receiverUserId", receiverUserId);
          params.set("recipient", payment.counterparty);
        }
      } catch (e) {
        params.set("receiverUserId", receiverUserId);
        params.set("recipient", payment.counterparty);
      }
    } else {
      // Pas de userId connu — passer le nom comme fallback
      params.set("recipient", payment.counterparty);
    }

    navigate(`/transfer?${params.toString()}`);
  };

  // ── Badge statut ──────────────────────────────────────────────────────────
  const statusBadge = () => {
    switch (payment.status) {
      case "pending":
        return (
          <span className="bg-amber-50 text-amber-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-100">
            {t("scheduler.list.status.pending")}
          </span>
        );
      case "confirmed":
        return (
          <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
            {t("scheduler.list.status.confirmed")}
          </span>
        );
      case "paid":
        return (
          <span className="bg-green-50 text-green-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-100">
            {t("scheduler.list.status.paid")}
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-gray-100 text-gray-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-gray-200">
            {t("scheduler.list.status.cancelled")}
          </span>
        );
    }
  };

  return (
    <div
      className={`transition-all duration-300 ${isSelected ? "scale-[0.98]" : ""} ${highlighted ? "ring-2 ring-(--primary-color) rounded-2xl" : ""}`}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress?.(payment.id);
      }}
    >
      {/* ── Ligne principale ─────────────────────────────────────────────── */}
      <div
        onClick={() =>
          isSelectionMode ? onSelect?.(payment.id) : setExpanded(!expanded)
        }
        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.99] cursor-pointer ${isSelected
          ? "bg-purple-50 dark:bg-purple-900/10 border-(--primary-color)"
          : highlighted
            ? "theme-primary-bg/5 border-(--primary-color)/30"
            : "theme-card-bg shadow-sm theme-border"
          }`}
      >
        {/* Checkbox mode sélection */}
        {isSelectionMode && (
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "theme-primary-bg border-transparent" : "border-gray-300"}`}
          >
            {isSelected && <Check size={14} className="text-white" />}
          </div>
        )}

        {/* Icône direction */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isOutgoing ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}
        >
          {isOutgoing ? (
            <ArrowUpRight size={22} />
          ) : (
            <ArrowDownLeft size={22} />
          )}
        </div>

        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-bold theme-text-main text-sm truncate">
              {payment.title ||
                t("scheduler.item.request_from", {
                  name: payment.counterparty,
                })}
            </h4>
            <span className="text-sm font-black theme-text-main shrink-0">
              {displayMoney(payment.amount * 100)} G.
            </span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <p className="text-[10px] theme-text-secondary truncate">
              {isOutgoing ? "→" : "←"} {payment.counterparty} ·{" "}
              {formatDate(payment.dueDate, t("intl.locale"))}
            </p>
            {statusBadge()}
          </div>
          {/* Compteur rappels actifs */}
          {activeReminderCount > 0 && payment.status !== "cancelled" && (
            <p className="text-[9px] theme-primary-text font-bold flex items-center gap-1">
              <Clock size={9} />{" "}
              {activeReminderCount > 1
                ? t("scheduler.item.active_reminders_plural", {
                  count: activeReminderCount,
                })
                : t("scheduler.item.active_reminders", {
                  count: activeReminderCount,
                })}
            </p>
          )}
        </div>

        {/* Chevron expand */}
        {!isSelectionMode && (
          <div className="theme-text-secondary opacity-40 shrink-0">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </div>

      {/* ── Panneau expandé ──────────────────────────────────────────────── */}
      {expanded && !isSelectionMode && (
        <div className="mt-2 p-4 theme-bubble-bg rounded-2xl border theme-border space-y-5 animate-in slide-in-from-top duration-200">
          {/* Infos date */}
          <div className="flex items-center gap-2 text-xs theme-text-secondary">
            <Calendar size={14} className="theme-primary-text" />
            <span className="font-bold">
              {t("scheduler.item.due_date_full", {
                date: new Date(payment.dueDate).toLocaleDateString(
                  t("intl.locale"),
                  { day: "numeric", month: "long", year: "numeric" },
                ),
              })}
            </span>
          </div>

          {/* ── CÔTÉ PAYEUR : bouton payer ────────────────────────────── */}
          {isOutgoing && payment.status === "confirmed" && (
            <button
              onClick={handlePayFromReminder}
              className="w-full flex items-center justify-center gap-2 py-3 theme-primary-bg text-white rounded-xl text-sm font-black active:scale-95 transition-all shadow-md"
            >
              <CreditCard size={16} />{" "}
              {t("scheduler.item.pay_now_amount", {
                amount: displayMoney(payment.amount * 100),
              })}
            </button>
          )}

          {/* Message info pour payeur si confirmé */}
          {isOutgoing && payment.status === "confirmed" && (
            <div className="w-full p-3 theme-bubble-bg rounded-xl border theme-border">
              <p className="text-[9px] theme-text-secondary text-center font-medium">
                {t("scheduler.pay_info")}
              </p>
            </div>
          )}

          {/* ── Infos si payé ──────────────────────────────────────── */}
          {isPaid && (payment as any).paidAt && (
            <div className="flex items-center gap-2 text-xs text-green-600 font-bold">
              <Check size={14} className="text-green-600" />
              {t("scheduler.item.paid_at_full", {
                date: new Date((payment as any).paidAt).toLocaleDateString(
                  t("intl.locale"),
                  { day: "numeric", month: "long", year: "numeric" },
                ),
                time: new Date((payment as any).paidAt).toLocaleTimeString(
                  t("intl.locale"),
                  { hour: "2-digit", minute: "2-digit" },
                ),
              })}
            </div>
          )}

          {/* ── Grille de rappels (receiver seulement, status confirmé seulement, pas paid) ── */}
          {isReceiver &&
            !isPaid &&
            payment.status !== "cancelled" &&
            localReminders.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                  {t("scheduler.reminders_grid")}
                </p>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-center text-[10px]">
                    <thead>
                      <tr>
                        <th className="w-20 px-1 pb-2" />
                        {localReminders.map((r) => (
                          <th
                            key={r.date}
                            onClick={() => toggleDay(r.date)}
                            className="px-1 pb-2 font-black theme-primary-text cursor-pointer active:opacity-50 whitespace-nowrap"
                          >
                            {formatDate(r.date, t("intl.locale"))}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          onClick={() => toggleRow("time1")}
                          className="text-[9px] font-black theme-text-secondary cursor-pointer active:opacity-50 text-left pr-2 py-1.5"
                        >
                          {t("scheduler.create.time_830")}
                        </td>
                        {localReminders.map((r) => (
                          <td key={r.date} className="py-1.5 px-1">
                            <button
                              onClick={() => toggleCell(r.date, "time1")}
                              className={`w-10 h-8 rounded-xl text-[9px] font-bold transition-all active:scale-90 ${r.time1Active ? "theme-primary-bg text-white shadow-sm" : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600"}`}
                            >
                              {r.time1Active
                                ? t("scheduler.create.time_830")
                                : "—"}
                            </button>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td
                          onClick={() => toggleRow("time2")}
                          className="text-[9px] font-black theme-text-secondary cursor-pointer active:opacity-50 text-left pr-2 py-1.5"
                        >
                          {t("scheduler.create.time_1230")}
                        </td>
                        {localReminders.map((r) => (
                          <td key={r.date} className="py-1.5 px-1">
                            <button
                              onClick={() => toggleCell(r.date, "time2")}
                              className={`w-10 h-8 rounded-xl text-[9px] font-bold transition-all active:scale-90 ${r.time2Active ? "theme-primary-bg text-white shadow-sm" : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600"}`}
                            >
                              {r.time2Active
                                ? t("scheduler.create.time_1230")
                                : "—"}
                            </button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Note : bouton "Sauvegarder les rappels" supprimé selon cahier des charges */}
              </div>
            )}

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <div className="flex gap-2 flex-wrap">
            {/* Si payé → bouton "Supprimer ce rappel" uniquement */}
            {isPaid && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 theme-border text-red-500 rounded-xl text-xs font-bold active:scale-95 transition-all border border-red-100"
              >
                {cancelling ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {t("scheduler.item.delete_this")}
              </button>
            )}

            {/* Receiver +  pending → Relancer QR (pas si payé) */}
            {isReceiver && !isPaid && payment.status === "pending" && (
              <button
                onClick={handleRegenerateQR}
                disabled={loadingQR}
                className="flex-1 flex items-center justify-center gap-2 py-3 theme-primary-bg text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-sm"
              >
                {loadingQR ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                {t("scheduler.item.relancer")}
              </button>
            )}

            {/* Receiver → bouton Annuler (si non payé, non annulé) */}
            {isReceiver && !isPaid && payment.status !== "cancelled" && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 rounded-xl text-xs font-bold active:scale-95 transition-all border border-red-100 disabled:opacity-50"
              >
                {cancelling ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <X size={14} />
                )}
                {t("scheduler.item.annuler")}
              </button>
            )}
          </div>

          {/* ── QR généré ──────────────────────────────────────────────── */}
          {qrUrl && qrLink && (
            <div className="flex flex-col items-center gap-3 p-4 theme-card-bg rounded-2xl border theme-border">
              <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                {t("scheduler.confirm_qr")}
              </p>
              <img src={qrUrl} alt="QR" className="w-40 h-40 rounded-xl" />
              {qrExpiry && (
                <p className="text-[9px] text-amber-500 font-bold">
                  {t("scheduler.expires_at", {
                    time: new Date(qrExpiry).toLocaleTimeString(
                      t("intl.locale"),
                      { hour: "2-digit", minute: "2-digit" },
                    ),
                  })}
                </p>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (!qrLink) return;
                    try {
                      await navigator.clipboard.writeText(qrLink);
                      setCopiedLink(true);
                      showToast(t("common.copied"), "success");
                      setTimeout(() => setCopiedLink(false), 2000);
                    } catch {
                      // Fallback pour navigateurs sans Clipboard API ou contexte non sécurisé
                      const textarea = document.createElement('textarea');
                      textarea.value = qrLink;
                      textarea.style.position = 'fixed';
                      textarea.style.opacity = '0';
                      document.body.appendChild(textarea);
                      textarea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textarea);
                      setCopiedLink(true);
                      showToast(t("common.copied"), "success");
                      setTimeout(() => setCopiedLink(false), 2000);
                    }
                  }}
                  disabled={!qrLink}
                  className="flex items-center gap-1 text-[10px] theme-primary-text font-bold underline disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {copiedLink ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  {t("scheduler.item.copy_link")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal confirmation annulation individuelle ───────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm theme-card-bg rounded-4xl p-8 space-y-6 text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={26} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black theme-text-main">
                {t("scheduler.item.delete_confirm_title")}
              </h3>
              <p className="text-xs theme-text-secondary">
                {t("scheduler.item.delete_confirm_desc", {
                  title: payment.title,
                })}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCancelConfirmed}
                className="w-full py-3.5 bg-red-500 text-white rounded-2xl font-black active:scale-95 transition-all shadow-lg text-sm"
              >
                {t("scheduler.item.delete_confirm_btn")}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full py-3 theme-text-secondary font-bold text-sm"
              >
                {t("scheduler.item.delete_cancel_btn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledPaymentItem;
