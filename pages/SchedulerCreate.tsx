// pages/SchedulerCreate.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  CalendarClock,
  Info,
  AlertCircle,
  ChevronRight,
  Loader2,
  UserPlus,
  Check,
  XCircle,
  Copy,
} from "lucide-react";
import { api } from "../services/apiService";
import { Contact, ReminderSlot } from "../shared/types";
import { useTranslation, useGlobalSync, useToast } from "../App";
import Modal from "../components/Modal";
import { ContactSearch } from "../components/ContactSearch";
import PageHeader from "../components/PageHeader";
import { MoneyInput } from "../components/MoneyInput";
import { displayMoney } from "../shared/money";

// ── Helper : générer les slots de rappel côté frontend ────────────────────────
function buildReminderSlots(dueDateStr: string): ReminderSlot[] {
  const slots: ReminderSlot[] = [];
  const now = new Date();
  const due = new Date(dueDateStr);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  for (let d = new Date(today); d <= dueDay; d.setDate(d.getDate() + 1)) {
    const isToday = d.toDateString() === now.toDateString();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    slots.push({
      date: d.toISOString().split("T")[0],
      time1Active: isToday ? currentMin < 510 : true, // 08h30
      time2Active: isToday ? currentMin < 750 : true, // 12h30
    });
  }
  return slots;
}

function formatDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

const SchedulerCreate: React.FC = () => {
  const { t } = useTranslation();
  const { syncData } = useGlobalSync() || { syncData: null };
  const navigate = useNavigate();
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form
  const [title, setTitle] = useState("");
  const [payerName, setPayerName] = useState(
    searchParams.get("payerName") || "",
  );
  const [payerUserId, setPayerUserId] = useState(
    searchParams.get("payerUserId") || "",
  );
  const [selectedContactAvatar, setSelectedContactAvatar] = useState<string | null>(null);
  const [amount, setAmount] = useState(searchParams.get("amount") || "");
  const [dueDate, setDueDate] = useState("");
  const [reminders, setReminders] = useState<ReminderSlot[]>([]);

  // Statuts
  const [isMutualFriend, setIsMutualFriend] = useState(false);
  const [checkingFriendship, setCheckingFriendship] = useState(false);
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);

  // Result
  const [created, setCreated] = useState<{
    qrToken: string;
    qrExpiresAt: string;
    id: string;
  } | null>(null);
  const [qrUrl, setQrUrl] = useState("");

  const [copiedLink, setCopiedLink] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    api.getContacts().then(setContacts);
  }, []);

  // Recalculer les slots quand la date change
  useEffect(() => {
    if (dueDate) setReminders(buildReminderSlots(dueDate));
  }, [dueDate]);

  // Vérifier amitié via API directe (plus fiable que syncData qui peut être périmé)
  useEffect(() => {
    if (!payerUserId) {
      setIsMutualFriend(false);
      return;
    }
    setCheckingFriendship(true);

    api
      .getFriendshipStatus(payerUserId)
      .then((friendship: any) => {
        // La route retourne l'objet Friendship ou null
        setIsMutualFriend(friendship?.status === "friends");
      })
      .catch(() => setIsMutualFriend(false))
      .finally(() => setCheckingFriendship(false));
  }, [payerUserId]); // syncData retiré — on se fie à l'API

  // Quand on sélectionne un contact dans la recherche
  const handleSelectContact = (contact: Partial<Contact>) => {
    setPayerName(contact.name || (contact as any).tag || "");
    setPayerUserId((contact as any).contactUserId || "");
    setSelectedContactAvatar(contact.avatarUrl || null);
    setSearchQuery("");
  };

  // Toggle cellule grille rappels
  const toggleCell = (dateStr: string, slot: "time1" | "time2") => {
    setReminders((prev) => {
      const updated = prev.map((r) => {
        if (r.date !== dateStr) return r;
        const next = { ...r };
        if (slot === "time1") next.time1Active = !r.time1Active;
        else next.time2Active = !r.time2Active;
        return next;
      });
      const hasActive = updated.some((r) => r.time1Active || r.time2Active);
      return hasActive ? updated : prev;
    });
  };

  const toggleDay = (dateStr: string) => {
    setReminders((prev) => {
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
    setReminders((prev) => {
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

  const activeCount = reminders.reduce(
    (a, r) => a + (r.time1Active ? 1 : 0) + (r.time2Active ? 1 : 0),
    0,
  );

  // ── Envoi demande d'ami ────────────────────────────────────────────────────
  const handleSendFriendRequest = async () => {
    if (!payerUserId) return;
    setSendingFriendRequest(true);
    try {
      await api.requestFriendship(payerUserId);
      setFriendRequestSent(true);
      setShowFriendRequestModal(false);
      alert(t("scheduler.create.friend_request_sent_alert"));
    } catch (e) {
      alert(t("scheduler.create.friend_request_error"));
    }
    setSendingFriendRequest(false);
  };

  // ── Créer le rappel ────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!payerName || !amount || !dueDate) return;
    if (payerUserId && !isMutualFriend) {
      setShowFriendRequestModal(true);
      return;
    }
    setLoading(true);
    try {
      const result = await api.createScheduledPayment({
        title: title || undefined,
        payerUserId: payerUserId || undefined,
        payerName,
        amount: parseFloat(amount),
        dueDate,
        reminders: reminders.length > 0 ? reminders : undefined,
      });
      const link = `https://piyes.ht/schedule?token=${result.qrToken}`;
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(link)}`;
      setQrUrl(url);
      setCreated({
        qrToken: result.qrToken!,
        qrExpiresAt: result.qrExpiresAt!,
        id: result.id,
      });
    } catch (e: any) {
      alert(e?.message || t("scheduler.create.create_error"));
    }
    setLoading(false);
  };

  const canCreate =
    payerName.trim().length > 0 &&
    parseFloat(amount) > 0 &&
    dueDate &&
    activeCount > 0;

  // Polling côté receiver : dès que le payeur confirme, naviguer vers le tab "Demandes envoyées"
  useEffect(() => {
    if (!created) return; // uniquement actif sur la vue succès (QR affiché)

    const interval = setInterval(async () => {
      try {
        const payments = await api.getScheduledPaymentsFresh();
        const thisPayment = payments.find((p) => p.id === created.id);
        if (thisPayment && thisPayment.status === "confirmed") {
          clearInterval(interval);
          // Naviguer vers "Demandes envoyées" avec surbrillance de l'item confirmé
          navigate(`/scheduler?tab=incoming&highlight=${created.id}`);
        }
      } catch {
        /* ignore */
      }
    }, 4000); // poll toutes les 4s

    return () => clearInterval(interval);
  }, [created, navigate]);

  // ─────────────────────────────────────────────────────────────────────────
  // VUE SUCCÈS
  // ─────────────────────────────────────────────────────────────────────────
  if (created) {
    return (
      <div className="theme-card-bg min-h-screen flex flex-col">
        <header className="px-6 pt-12 pb-6 border-b theme-border flex items-center gap-4 sticky top-0 theme-card-bg z-10">
          <button
            onClick={() => navigate("/scheduler")}
            className="p-2 -ml-2 theme-text-secondary active:scale-90"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold theme-text-main">
            {t("scheduler.create.success_title")}
          </h1>
        </header>

        <div className="flex-1 p-6 flex flex-col items-center gap-8 animate-in fade-in">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <Check size={32} />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black theme-text-main">
              {t("scheduler.create.waiting_confirmation")}
            </h2>
            <p className="text-sm theme-text-secondary">
              {t("scheduler.create.share_instruction", { name: payerName })}
            </p>
          </div>

          <div className="bg-white p-4 rounded-4xl shadow-xl border theme-border">
            <img src={qrUrl} alt="QR rappel" className="w-64 h-64" />
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={async () => {
                const link = `https://piyes.ht/schedule?token=${created.qrToken}`;
                try {
                  await navigator.clipboard.writeText(link);
                  setCopiedLink(true);
                  showToast(t("common.copied"), "success");
                  setTimeout(() => setCopiedLink(false), 2000);
                } catch {
                  const textarea = document.createElement('textarea');
                  textarea.value = link;
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
              className="w-full py-4 theme-bubble-bg theme-text-main rounded-2xl font-bold border theme-border active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
            >
              {copiedLink ? (
                <Check size={16} className="text-green-500" />
              ) : (
                <Copy size={16} />
              )}
              {t("scheduler.create.copy_link")}
            </button>
            <button
              onClick={() => navigate("/scheduler")}
              className="w-full py-4 theme-primary-bg text-white rounded-2xl font-black active:scale-95 transition-all shadow-lg text-sm"
            >
              {t("scheduler.create.view_reminders")}
            </button>
          </div>

          <div className="p-4 theme-bubble-bg rounded-2xl border theme-border w-full">
            <p className="text-[10px] theme-primary-text font-medium leading-relaxed text-center">
              {t("scheduler.create.timeout_info")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FORMULAIRE
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="theme-card-bg min-h-screen flex flex-col pb-32">
      <PageHeader
        title={t("scheduler.create.title")}
        onBack={() => navigate(-1)}
        rightElement={null}
        className="sticky top-0 theme-card-bg z-10 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
      />
      <div className="flex-1 p-6 space-y-7 overflow-y-auto no-scrollbar">
        <p className="text-[10px] theme-text-secondary">
          {t("scheduler.create.subtitle")}
        </p>

        {/* Payeur */}
        <div className="space-y-2">
          <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
            {t("scheduler.create.payer_label")}{" "}
            <span className="text-red-400">
              {t("scheduler.create.required")}
            </span>
          </label>

          {/* Chip contact sélectionné — s'affiche quand payerName est défini et searchQuery vide */}
          {payerName && !searchQuery ? (
            <div className="flex items-center gap-3 theme-primary-bg text-white rounded-full px-4 py-3 w-fit max-w-full">
              {selectedContactAvatar ? (
                <img
                  src={selectedContactAvatar}
                  alt={payerName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-white/30 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xs font-black">
                    {payerName
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
              )}
              <span className="font-bold text-sm truncate">{payerName}</span>
              <button
                type="button"
                onClick={() => {
                  setPayerName("");
                  setPayerUserId("");
                  setSelectedContactAvatar(null);
                  setSearchQuery("");
                  setIsMutualFriend(false);
                }}
                className="ml-1 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform"
              >
                <XCircle size={14} />
              </button>
            </div>
          ) : (
            <ContactSearch
              contacts={contacts}
              onSelect={handleSelectContact}
              placeholder={t("scheduler.create.payer_placeholder")}
              query={searchQuery}
              setQuery={setSearchQuery}
              currentUser={syncData?.user}
            />
          )}

          {/* Statut amitié — visible sous le chip */}
          {payerUserId && payerName && !searchQuery && (
            <div
              className={`flex items-center gap-2 px-2 text-[10px] font-bold ${isMutualFriend ? "text-green-500" : "text-amber-500"}`}
            >
              {checkingFriendship ? (
                <Loader2 size={12} className="animate-spin" />
              ) : isMutualFriend ? (
                <>
                  <Check size={12} /> {t("scheduler.create.mutual_friend")}
                </>
              ) : (
                <>
                  <AlertCircle size={12} />{" "}
                  {t("scheduler.create.not_mutual_friend")}
                </>
              )}
            </div>
          )}
        </div>

        {/* Titre (optionnel) */}
        <div className="space-y-2">
          <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
            {t("scheduler.create.title_label")}{" "}
            <span className="opacity-50">{t("scheduler.create.optional")}</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("scheduler.create.title_placeholder", {
              name: payerName || "...",
            })}
            className="w-full theme-bubble-bg p-4 rounded-2xl outline-none theme-text-main border theme-border focus:border-(--primary-color) transition-all font-bold"
          />
        </div>
        {/* Montant */}
        <div className="space-y-2">
          <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
            {t("scheduler.create.amount_label")}{" "}
            <span className="text-red-400">
              {t("scheduler.create.required")}
            </span>
          </label>
          <div className="flex items-baseline gap-2 border-b-2 theme-border pb-2">
            <span className="text-xl font-black theme-text-secondary">G.</span>
            <MoneyInput
              value={amount ? parseFloat(amount) : undefined}
              onValueChange={(val) => setAmount(val !== undefined ? val.toString() : "")}
              placeholder="0,00"
              className="w-full text-4xl font-black outline-none bg-transparent theme-text-main"
            />
          </div>
        </div>

        {/* Date d'échéance */}
        <div className="space-y-2">
          <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
            {t("scheduler.create.due_date_label")}{" "}
            <span className="text-red-400">
              {t("scheduler.create.required")}
            </span>
          </label>
          <input
            type="date"
            value={dueDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full theme-bubble-bg p-4 rounded-2xl outline-none theme-text-main border theme-border focus:border-(--primary-color) transition-all font-bold text-sm"
          />
        </div>

        {/* Grille de rappels */}
        {reminders.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                {t("scheduler.create.reminders_label")}
              </label>
              <span className="text-[9px] theme-primary-text font-bold">
                {activeCount}{" "}
                {activeCount > 1
                  ? t("scheduler.create.actives")
                  : t("scheduler.create.active")}
              </span>
            </div>

            <div className="theme-bubble-bg rounded-2xl border theme-border p-3 overflow-x-auto no-scrollbar">
              <table className="w-full text-center text-[10px]">
                <thead>
                  <tr>
                    <th className="w-16 pb-2" />
                    {reminders.map((r) => (
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
                      className="text-[9px] font-black theme-text-secondary cursor-pointer active:opacity-50 text-left py-1.5"
                    >
                      08h30
                    </td>
                    {reminders.map((r) => (
                      <td key={r.date} className="py-1.5 px-0.5">
                        <button
                          onClick={() => toggleCell(r.date, "time1")}
                          className={`w-10 h-8 rounded-xl text-[9px] font-bold transition-all active:scale-90 ${r.time1Active
                            ? "theme-primary-bg text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600"
                            }`}
                        >
                          {r.time1Active ? t("scheduler.create.time_830") : "—"}
                        </button>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td
                      onClick={() => toggleRow("time2")}
                      className="text-[9px] font-black theme-text-secondary cursor-pointer active:opacity-50 text-left py-1.5"
                    >
                      12h30
                    </td>
                    {reminders.map((r) => (
                      <td key={r.date} className="py-1.5 px-0.5">
                        <button
                          onClick={() => toggleCell(r.date, "time2")}
                          className={`w-10 h-8 rounded-xl text-[9px] font-bold transition-all active:scale-90 ${r.time2Active
                            ? "theme-primary-bg text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600"
                            }`}
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
            <p className="text-[9px] theme-text-secondary opacity-60 italic px-1">
              {t("scheduler.create.grid_instruction")}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="p-4 theme-bubble-bg rounded-2xl border theme-border flex gap-3 items-start">
          <Info size={16} className="theme-primary-text shrink-0 mt-0.5" />
          <p className="text-[10px] theme-primary-text font-medium leading-relaxed">
            {t("scheduler.create.info_text")}
          </p>
        </div>

        {/* Bouton créer */}
        <button
          onClick={handleCreate}
          disabled={!canCreate || loading}
          className="w-full py-5 theme-primary-bg text-white rounded-3xl font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-3"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <CalendarClock size={20} />
          )}
          {t("scheduler.create.btn_create")}
        </button>
      </div>

      {/* Modal demande d'ami nécessaire */}
      <Modal
        isOpen={showFriendRequestModal}
        onClose={() => setShowFriendRequestModal(false)}
        type="centered"
      >
        <div className="p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <UserPlus size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black theme-text-main">
              {t("scheduler.create.friend_request_modal.title")}
            </h3>
            <p className="text-sm theme-text-secondary">
              {t("scheduler.create.friend_request_modal.desc", {
                name: payerName,
              })}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSendFriendRequest}
              disabled={sendingFriendRequest || friendRequestSent}
              className="w-full py-4 theme-primary-bg text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sendingFriendRequest ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <UserPlus size={18} />
              )}
              {friendRequestSent
                ? t("scheduler.create.friend_request_modal.btn_sent")
                : t("scheduler.create.friend_request_modal.btn_send")}
            </button>
            <button
              onClick={() => setShowFriendRequestModal(false)}
              className="w-full py-3 theme-text-secondary font-bold text-sm"
            >
              {t("scheduler.create.friend_request_modal.cancel")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SchedulerCreate;
