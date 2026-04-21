// pages/RequestPayment.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  QrCode,
  X,
  Check,
  Copy,
  CalendarClock,
  Info,
  AlertCircle,
  HelpCircle,
  Send,
  Clock,
} from "lucide-react";
import { api } from "../services/apiService";
import { User, Key, Contact, Friendship } from "../shared/types";
import { useTranslation, useGlobalSync } from "../App";
import Button from "../components/Button";
import AccountSummary from "../components/AccountSummary";
import AiSupportChat from "../components/AiSupportChat";
import { ContactSearch } from "@/components/ContactSearch";
import OperationResult from "../components/OperationResult";
import { useToast } from "../App";
import PageHeader from "../components/PageHeader";

interface RequestPaymentProps {
  user: User;
}

const RequestPayment: React.FC<RequestPaymentProps> = ({ user }) => {
  const { t } = useTranslation();
  const { syncData } = useGlobalSync() || { syncData: null };
  const navigate = useNavigate();
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const [keys, setKeys] = useState<Key[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);

  const [selectedKey, setSelectedKey] = useState("");
  const [payerName, setPayerName] = useState(searchParams.get("name") || "");
  const [amount, setAmount] = useState(searchParams.get("amount") || "");
  const [step, setStep] = useState(1);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isExpired, setIsExpired] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { showToast } = useToast();

  const [receivedTx, setReceivedTx] = useState<{
    txId: string;
    amount: number;
    senderName: string;
  } | null>(null);
  const [pollingStartBalance, setPollingStartBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactsData, syncData] = await Promise.all([
        api.getContactsFresh(),
        api.syncFresh(),
      ]);
      setContacts(contactsData);
      setFriendships(syncData.friendships || []);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  useEffect(() => {
    if (step !== 2 || isExpired || pollingStartBalance === null) return;

    const interval = setInterval(async () => {
      try {
        const sync = await api.syncFresh();
        const newBalance = sync.user.balance;

        if (newBalance > pollingStartBalance) {
          clearInterval(interval);

          const history = await api.getHistory({ limit: 1 });
          const lastTx = history[0];
          const senderName = lastTx?.counterpartyName || payerName || "";

          setReceivedTx({
            txId: lastTx?.id || "",
            amount: parseFloat(amount),
            senderName,
          });
        }
      } catch {
        /* ignore */
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, isExpired, pollingStartBalance, amount, payerName]);

  const handleGenerateQR = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    let to = user.accountNumber;
    let type = "id";

    if (selectedKey) {
      const key = keys.find((k) => k.value === selectedKey);
      if (key) {
        to = key.value;
        type = key.type;
        if (type === "tag") to = to.replace("@", "");
      }
    } else {
      if (user.tag) {
        to = user.tag.replace("@", "");
        type = "tag";
      } else if (user.phone) {
        to = user.phone;
        type = "phone";
      } else if (user.email) {
        to = user.email;
        type = "email";
      }
    }

    const expiry = Date.now() + 120 * 1000;
    const qrData = `https://piyes.ht/pay?to=${encodeURIComponent(to)}&type=${type}&amount=${amount}&expiry=${expiry}&payer=${encodeURIComponent(payerName)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    setGeneratedQR(qrUrl);
    setTimeLeft(120);
    setIsExpired(false);

    try {
      const sync = await api.syncFresh();
      setPollingStartBalance(sync.user.balance);
    } catch {
      /* ignore */
    }

    setStep(2);
  };

  const handleCopyLink = () => {
    let to = user.accountNumber;
    let type = "id";

    if (selectedKey) {
      const key = keys.find((k) => k.value === selectedKey);
      if (key) {
        to = key.value;
        type = key.type;
        if (type === "tag") to = to.replace("@", "");
      }
    } else {
      if (user.tag) {
        to = user.tag.replace("@", "");
        type = "tag";
      } else if (user.phone) {
        to = user.phone;
        type = "phone";
      } else if (user.email) {
        to = user.email;
        type = "email";
      }
    }

    const link = `https://piyes.ht/pay?to=${encodeURIComponent(to)}&type=${type}&amount=${amount}`;
    navigator.clipboard.writeText(link);
    alert(t("request.copy_link"));
  };

  const handleSelectUser = (contact: Partial<Contact>) => {
    const displayName = contact.name || contact.tag || contact.phone || contact.email || "";
    setPayerName(displayName);
    setSearchQuery("");
  };

  if (receivedTx) {
    return (
      <OperationResult
        type="transfer"
        status="success"
        amount={receivedTx.amount}
        recipientName={receivedTx.senderName}
        txId={receivedTx.txId}
        role="receiver"
      />
    );
  }

  return (
    <div className="theme-card-bg min-h-screen flex flex-col">
      <PageHeader
        title={t("request.title")}
        onBack={() => (step === 1 ? navigate(-1) : setStep(1))}
        rightElement={
          <div className="w-10 h-10 rounded-full theme-bubble-bg flex items-center justify-center theme-text-secondary active:scale-90 transition-transform opacity-80 hover:opacity-100">
            <HelpCircle size={20} onClick={() => setShowSupport(true)} />
          </div>
        }
        className="sticky top-0 theme-card-bg z-10"
      />

      <div className="flex-1 p-6 space-y-8 animate-in fade-in overflow-y-auto no-scrollbar">
        {step === 1 ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold theme-text-secondary uppercase tracking-widest px-1">
                {t("request.amount_label", { required: t("common.required") })}
              </label>
              <div className="flex items-center border-b-2 theme-border pb-2">
                <span className="text-xl font-bold theme-text-secondary mr-2">
                  {t("currency.symbol")}
                </span>
                <input
                  autoFocus
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t("transfer.amount_placeholder")}
                  className="w-full text-5xl font-bold outline-none bg-transparent theme-text-main"
                />
              </div>
            </div>

            <AccountSummary user={user} type="deposit" amount={amount} />

            <div className="space-y-2">
              <label className="text-xs font-bold theme-text-secondary uppercase tracking-widest px-1">
                {t("request.payer_label", { optional: t("common.optional") })}
              </label>
              <ContactSearch
                contacts={contacts}
                onSelect={handleSelectUser}
                placeholder={t("transfer.search_placeholder")}
                query={searchQuery}
                setQuery={setSearchQuery}
                currentUser={user}
              />

              {payerName && !searchQuery && (
                <div className="flex items-center gap-2 mt-2 px-1">
                  <span className="text-xs theme-text-secondary">
                    {t("transfer.selected_recipient")}:
                  </span>
                  <span className="bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full text-xs font-bold theme-primary-text">
                    {payerName}
                  </span>
                  <button
                    onClick={() => setPayerName("")}
                    className="p-1 theme-text-secondary hover:theme-primary-text"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4">
              <Button
                fullWidth
                disabled={!amount || parseFloat(amount) <= 0}
                onClick={handleGenerateQR}
                leftIcon={<QrCode size={20} />}
              >
                {t("request.btn_qr")}
              </Button>
              <Button
                variant="utility"
                fullWidth
                disabled={!amount || parseFloat(amount) <= 0}
                onClick={() => navigate(`/transfer?amount=${amount}`)}
                leftIcon={<Send size={20} />}
              >
                {t("request.btn_send_amount")}
              </Button>
              <Button
                variant="utility"
                fullWidth
                onClick={() => {
                  const params = new URLSearchParams();
                  if (amount) params.append("amount", amount);
                  if (payerName) params.append("payerName", payerName);
                  navigate(`/scheduler/create?${params.toString()}`);
                }}
                leftIcon={<CalendarClock size={20} />}
              >
                {t("request.btn_schedule")}
              </Button>
            </div>

            <div className="p-4 theme-bubble-bg rounded-2xl border theme-border flex gap-3 items-start">
              <Info size={18} className="theme-primary-text shrink-0 mt-0.5" />
              <p className="text-[10px] theme-primary-text font-medium leading-relaxed italic">
                {t("request.info_tip")}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in zoom-in duration-300">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full mb-2">
                <Check size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold theme-text-main">
                {t("request.success_title")}
              </h2>
              <p className="text-3xl font-black theme-primary-text">
                {parseFloat(amount).toLocaleString("fr-HT")} {t("currency.symbol")}
              </p>
            </div>

            <div className="bg-white p-6 rounded-4xl shadow-2xl border theme-border mx-auto max-w-70 relative">
              <div className={`transition-all duration-300 ${isExpired ? "blur-md opacity-20 grayscale" : ""}`}>
                <img src={generatedQR!} alt="Request QR" className="w-full h-full" />
              </div>
              {isExpired && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <AlertCircle size={24} />
                  </div>
                  <p className="text-sm font-black text-red-600 uppercase tracking-tighter">
                    {t("request.qr_expired")}
                  </p>
                  <button onClick={handleGenerateQR} className="text-[10px] font-bold theme-primary-text underline">
                    {t("request.generate_new")}
                  </button>
                </div>
              )}
            </div>

            {!isExpired && (
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center gap-2 theme-text-secondary">
                  <Clock size={14} />
                  <span className="text-xs font-bold">
                    {t("request.expires_in")} {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${timeLeft < 30 ? "bg-red-500" : "theme-primary-bg"}`}
                    style={{ width: `${(timeLeft / 120) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Button variant="utility" fullWidth onClick={handleCopyLink} leftIcon={<Copy size={18} />}>
                {t("request.copy_link")}
              </Button>
              <button onClick={() => setStep(1)} className="w-full text-center theme-text-secondary text-xs font-bold">
                {t("request.modify")}
              </button>
            </div>

            <div className="p-6 border-t theme-border">
              <p className="text-center text-[10px] theme-text-secondary leading-relaxed italic">
                {t("request.footer_tip")}
              </p>
            </div>
          </div>
        )}
      </div>
      <AiSupportChat isOpen={showSupport} onClose={() => setShowSupport(false)} context={t("actions.deposit")} />
    </div>
  );
};

export default RequestPayment;