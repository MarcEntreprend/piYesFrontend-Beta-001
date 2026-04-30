// pages/InterBankTransfer.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "../src/assets/images/logo-piyes-ppl-wh-wh-svg.svg";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Home,
  ChevronRight,
  RefreshCw,
  ArrowRightLeft,
  Info,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { api } from "../services/apiService";
import {
  User,
  Account,
  TransactionType,
  TransactionRole,
} from "../shared/types";
import { useTranslation, useSecurity, useGlobalSync } from "../App";
import Modal from "../components/Modal";
import Button from "../components/Button";
import PinOverlay from "../components/PinOverlay";
import AccountSummary from "../components/AccountSummary";
import OperationResult from "../components/OperationResult";
import BankIcon from "../components/BankIcon";
import { financeService } from "../services/financeService";
import StepIndicator from "../components/StepIndicator";
import PageHeader from "../components/PageHeader";
import { MoneyInput } from '../components/MoneyInput';
import { cacheService } from "@/services/cacheService";

interface InterBankTransferProps {
  user: User;
  onUpdateUser?: (user: User) => void;
}

const InterBankTransfer: React.FC<InterBankTransferProps> = ({
  user,
  onUpdateUser,
}) => {
  const { t } = useTranslation();
  const { syncData, refresh } = useGlobalSync();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleForgotPin } = useSecurity();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: "success" | "failure";
    tx?: any;
    error?: string;
  } | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [pickerMode, setPickerMode] = useState<"source" | "dest" | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  const [sourceId, setSourceId] = useState<string>("");
  const [destId, setDestId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    api.getAccounts().then((accs) => {
      // Filter out inactive accounts
      const activeAccs = accs.filter((a) => a.status === "active");

      const syncedAccs = activeAccs.map((a) =>
        a.provider === "piyes" ? { ...a, balance: user.balance } : a,
      );
      setAccounts(syncedAccs);

      const bankParam = searchParams.get("bank");
      const modeParam = searchParams.get("mode");

      const piAccount = syncedAccs.find((a) => a.provider === "piyes");
      const extAccount =
        syncedAccs.find((a) => a.id === bankParam) ||
        syncedAccs.find((a) => a.provider !== "piyes");

      if (modeParam === "deposit" && extAccount && piAccount) {
        setSourceId(extAccount.id);
        setDestId(piAccount.id);
      } else if (modeParam === "withdraw" && extAccount && piAccount) {
        setSourceId(piAccount.id);
        setDestId(extAccount.id);
      } else if (piAccount && extAccount) {
        setSourceId(piAccount.id);
        setDestId(extAccount.id);
      }
    });
  }, [searchParams, user.balance]);

  const sourceAccount = useMemo(
    () => accounts.find((a) => a.id === sourceId),
    [accounts, sourceId],
  );
  const destAccount = useMemo(
    () => accounts.find((a) => a.id === destId),
    [accounts, destId],
  );

  const visibleAccounts = useMemo(() => {
    if (!pickerMode) return [];
    return accounts.filter((acc) => {
      const otherId = pickerMode === "source" ? destId : sourceId;
      const otherAcc = accounts.find((a) => a.id === otherId);
      if (otherAcc?.provider === "piyes" && acc.provider === "piyes")
        return false;
      return true;
    });
  }, [accounts, pickerMode, sourceId, destId]);

  // Logic to validate each step of the inter-bank transfer flow
  const isStep1Invalid = useMemo(
    () => !sourceId || !destId || sourceId === destId,
    [sourceId, destId],
  );
  const isStep2Invalid = useMemo(() => {
    const val = parseFloat(amount);
    return (
      isNaN(val) ||
      val <= 0 ||
      (sourceAccount ? val > sourceAccount.balance : false)
    );
  }, [amount, sourceAccount]);

  // Contexte interbancaire pour les frais
  const isInterbankOut = useMemo(
    () => sourceAccount?.provider === "piyes" && destAccount?.provider !== "piyes",
    [sourceAccount, destAccount],
  );

  const handleSwap = () => {
    setIsSwapping(true);
    const temp = sourceId;
    setSourceId(destId);
    setDestId(temp);
    setTimeout(() => setIsSwapping(false), 500);
  };

  const handlePreProcess = () => {
    // Si c'est un dépôt (Source externe -> piYès), pas de barrage PIN
    if (sourceAccount?.provider !== "piyes") {
      handleProcess();
      return;
    }

    if (syncData.user.hasPin) {
      setIsVerifyingPin(true);
    } else {
      handleProcess();
    }
  };

  const handleProcess = async (pin?: string) => {
    if (!sourceAccount || !destAccount) return;
    setIsVerifyingPin(false);
    setLoading(true);
    try {
      const numericAmount = parseFloat(amount);

      // Calcul du montant net avec les frais éventuels
      const feeCalculation = financeService.calculateFees(
        numericAmount,
        TransactionType.TRANSFER,
        { isInterbankOut }
      );
      const netAmount = feeCalculation.netAmount;

      const res = await api.interBankTransfer({
        sourceId,
        destId,
        amount: netAmount, // On envoie le montant net
        note,
        pin,
      });

      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }

      const tx = {
        id: res.id,
        amount: netAmount,
        date: new Date().toISOString(),
        sourceName: sourceAccount.label,
        destName: destAccount.label,
        type: TransactionType.TRANSFER,
        role:
          sourceAccount.provider === "piyes"
            ? TransactionRole.PAYER
            : TransactionRole.RECEIVER,
      };

      // Trigger global sync refresh
      await api.syncFresh();
      await refresh();
      cacheService.clearHistoryCache();
      sessionStorage.removeItem('piyes-history-state');

      setResult({ status: "success", tx });
    } catch (e: any) {
      setResult({ status: "failure", error: e.message || t("common.error") });
    } finally {
      setLoading(false);
    }
  };

  const selectAccount = (id: string) => {
    const piAccount = accounts.find((a) => a.provider === "piyes");
    const piId = piAccount?.id || "";
    const selectedAcc = accounts.find((a) => a.id === id);

    if (pickerMode === "source") {
      if (selectedAcc?.provider !== "piyes") setDestId(piId);
      setSourceId(id);
    } else if (pickerMode === "dest") {
      if (selectedAcc?.provider !== "piyes") setSourceId(piId);
      setDestId(id);
    }
    setPickerMode(null);
  };

  const summaryType =
    sourceAccount?.provider === "piyes" ? "transfer" : "deposit";

  if (result)
    return (
      <OperationResult
        type={summaryType}
        status={result.status}
        amount={result.tx?.amount || parseFloat(amount)}
        recipientName={destAccount?.label}
        reason={result.error}
        txId={result.tx?.id}
        role={result.tx?.role}
      />
    );

  return (
    <div className="theme-card-bg min-h-screen flex flex-col animate-in fade-in duration-300 pb-12 overflow-x-hidden relative">
      {isVerifyingPin && (
        <PinOverlay
          mode="action"
          onCancel={() => setIsVerifyingPin(false)}
          onSuccess={handleProcess}
          onForgot={() => {
            setIsVerifyingPin(false);
            handleForgotPin();
          }}
          onFailure={() => navigate("/")}
        />
      )}
      <PageHeader
        title={t("interbank.title")}
        subtitle={t("common.step_of", { current: step, total: 3 })}
        onBack={() => (step === 1 ? navigate(-1) : setStep(step - 1))}
        rightElement={
          <div className="w-10 h-10 rounded-full theme-bubble-bg flex items-center justify-center theme-primary-text border theme-border shadow-sm">
            <ArrowRightLeft size={20} />
          </div>
        }
      >
      </PageHeader>

      {/* Indicateur d'étapes - 3 étapes */}
      <StepIndicator totalSteps={4} currentStep={step} />

      <main className="flex-1 p-6 flex flex-col overflow-y-auto no-scrollbar">
        {step === 1 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-400">
            <div className="space-y-2">
              <h2 className="text-2xl font-black theme-text-main tracking-tight">
                {t("interbank.step1_title")}
              </h2>
              <p className="text-sm theme-text-secondary">
                {t("interbank.step1_sub")}
              </p>
            </div>

            <div className="relative space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                  {t("interbank.source_label")}
                </label>
                <button
                  onClick={() => setPickerMode("source")}
                  className="w-full flex items-center gap-4 p-5 theme-bubble-bg rounded-[28px] border-2 border-transparent hover:border-(--primary-color) transition-all text-left group"
                >
                  <BankIcon
                    logoUrl={
                      sourceAccount?.provider === "piyes"
                        ? logo
                        : sourceAccount?.logoUrl
                    }
                    logoText={sourceAccount?.logoText || "?"}
                    color={sourceAccount?.color || "#eee"}
                    size="lg"
                    className="group-active:scale-95 transition-transform shadow-lg"
                    id={sourceAccount?.id}
                  />
                  <div className="flex-1">
                    <p className="font-black theme-text-main text-base">
                      {sourceAccount?.label || t("common.select")}
                    </p>
                    <p className="text-[10px] font-bold theme-text-secondary mt-0.5">
                      {t("interbank.balance_available", {
                        amount:
                          sourceAccount?.balance.toLocaleString("fr-HT") || "0",
                      })}
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className="theme-text-secondary opacity-30"
                  />
                </button>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
                <button
                  onClick={handleSwap}
                  className={`w-12 h-12 theme-card-bg rounded-full border-4 theme-border shadow-xl flex items-center justify-center theme-primary-text active:scale-90 transition-all ${isSwapping ? "rotate-180" : ""}`}
                >
                  <RefreshCw size={20} />
                </button>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                  {t("interbank.dest_label")}
                </label>
                <button
                  onClick={() => setPickerMode("dest")}
                  className="w-full flex items-center gap-4 p-5 theme-bubble-bg rounded-[28px] border-2 border-transparent hover:border-(--primary-color) transition-all text-left group"
                >
                  <BankIcon
                    logoUrl={
                      destAccount?.provider === "piyes"
                        ? logo
                        : destAccount?.logoUrl
                    }
                    logoText={destAccount?.logoText || "?"}
                    color={destAccount?.color || "#eee"}
                    size="lg"
                    className="group-active:scale-95 transition-transform shadow-lg"
                    id={destAccount?.id}
                  />
                  <div className="flex-1">
                    <p className="font-black theme-text-main text-base">
                      {destAccount?.label || t("common.select")}
                    </p>
                    <p className="text-[10px] font-bold theme-text-secondary mt-0.5">
                      {t("interbank.balance_available", {
                        amount:
                          destAccount?.balance.toLocaleString("fr-HT") || "0",
                      })}
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className="theme-text-secondary opacity-30"
                  />
                </button>
              </div>
            </div>

            <div className="p-5 theme-bubble-bg rounded-4xl border theme-border flex gap-4 items-start">
              <Info size={20} className="theme-primary-text shrink-0 mt-0.5" />
              <p className="text-[11px] theme-primary-text font-medium leading-relaxed">
                {t("interbank.summary_text", {
                  source: sourceAccount?.label || "...",
                  dest: destAccount?.label || "...",
                })}
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-400">
            <div className="space-y-2">
              <h2 className="text-2xl font-black theme-text-main tracking-tight">
                {t("interbank.step2_title")}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold theme-text-secondary">
                  {sourceAccount?.label}
                </span>
                <ChevronRight
                  size={12}
                  className="theme-text-secondary opacity-40"
                />
                <span className="text-xs font-bold theme-primary-text">
                  {destAccount?.label}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col items-center py-6 border-b-2 theme-border transition-all focus-within:border-(--primary-color)">
                <span className="text-lg font-black theme-text-secondary mb-2 uppercase tracking-[0.2em]">
                  {t("currency.name_plural")}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black theme-text-secondary">
                    {t("currency.symbol")}
                  </span>
                  <MoneyInput
                    autoFocus
                    value={amount ? parseFloat(amount) : undefined}
                    onValueChange={(val) => setAmount(val !== undefined ? val.toString() : "")}
                    placeholder="0,00"
                    maxValue={100000}
                    showWarning={true}
                    className="w-full text-6xl font-black outline-none bg-transparent theme-text-main text-center"
                  />
                </div>
              </div>

              <AccountSummary
                user={user}
                type={summaryType}
                amount={amount}
                isInterbankOut={isInterbankOut} // Passage du contexte
              />

              <div className="space-y-2">
                <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                  {t("interbank.note_placeholder")}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("interbank.note_example")}
                  className="w-full p-5 theme-bubble-bg rounded-3xl outline-none theme-text-main border theme-border focus:border-(--primary-color) transition-all resize-none h-24 text-sm font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-400">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-black theme-text-main tracking-tight">
                {t("interbank.step3_title")}
              </h2>
              <p className="text-sm theme-text-secondary">
                {t("interbank.verify_info")}
              </p>
            </div>

            <div className="theme-bubble-bg rounded-[40px] border theme-border overflow-hidden p-8 space-y-8 relative">
              <div className="absolute top-0 left-0 right-0 h-2 theme-primary-bg opacity-10"></div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black theme-text-secondary uppercase tracking-[0.2em]">
                  {t("interbank.total_amount")}
                </span>
                <h3 className="text-5xl font-black theme-text-main">
                  {parseFloat(amount).toLocaleString("fr-HT")}{" "}
                  {t("currency.symbol")}
                </h3>
              </div>

              <div className="space-y-6 pt-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black theme-text-secondary uppercase tracking-widest">
                      {t("interbank.source_label")}
                    </p>
                    <p className="text-sm font-bold theme-text-main">
                      {sourceAccount?.label}
                    </p>
                    <p className="text-[10px] theme-text-secondary">
                      {t("interbank.account_prefix")}{" "}
                      {sourceAccount?.accountNumber}
                    </p>
                  </div>
                  <BankIcon
                    logoUrl={sourceAccount?.logoUrl}
                    logoText={sourceAccount?.logoText || "?"}
                    color={sourceAccount?.color || "#eee"}
                    size="sm"
                  />
                </div>

                <div className="flex justify-center">
                  <div className="w-8 h-8 theme-bubble-bg rounded-full flex items-center justify-center theme-text-secondary">
                    <ChevronDown size={16} />
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black theme-text-secondary uppercase tracking-widest">
                      {t("interbank.dest_label")}
                    </p>
                    <p className="text-sm font-bold theme-text-main">
                      {destAccount?.label}
                    </p>
                    <p className="text-[10px] theme-text-secondary">
                      {t("interbank.account_prefix")}{" "}
                      {destAccount?.accountNumber}
                    </p>
                  </div>
                  <BankIcon
                    logoUrl={
                      destAccount?.provider === "piyes"
                        ? logo
                        : destAccount?.logoUrl
                    }
                    logoText={destAccount?.logoText || "?"}
                    color={destAccount?.color || "#eee"}
                    size="sm"
                    id={destAccount?.id}
                  />
                </div>

                <AccountSummary
                  user={user}
                  type={summaryType}
                  amount={amount}
                  isInterbankOut={isInterbankOut} // Passage du contexte
                />

                {note && (
                  <div className="p-4 theme-bubble-bg rounded-2xl border-l-4 border-(--primary-color)">
                    <p className="text-[9px] font-black theme-text-secondary uppercase tracking-widest mb-1">
                      {t("interbank.note_label")}
                    </p>
                    <p className="text-xs font-medium italic theme-text-main">
                      "{note}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto pt-8">
          {step === 1 && (
            <Button
              onClick={() => setStep(2)}
              disabled={isStep1Invalid}
              fullWidth
              size="lg"
              rightIcon={<ChevronRight size={20} />}
              className="py-5 rounded-3xl font-black shadow-xl uppercase tracking-widest"
            >
              {t("common.continue")}
            </Button>
          )}
          {step === 2 && (
            <Button
              onClick={() => setStep(3)}
              disabled={isStep2Invalid}
              fullWidth
              size="lg"
              rightIcon={<ChevronRight size={20} />}
              className="py-5 rounded-3xl font-black shadow-xl uppercase tracking-widest"
            >
              {t("common.confirm")}
            </Button>
          )}
          {step === 3 && (
            <Button
              onClick={handlePreProcess}
              disabled={loading || isStep2Invalid}
              fullWidth
              size="lg"
              isLoading={loading}
              className="py-5 rounded-3xl font-black shadow-2xl uppercase tracking-widest min-h-[64px]"
            >
              {t("interbank.btn_proceed")}
            </Button>
          )}
        </div>
      </main>

      <Modal isOpen={!!pickerMode} onClose={() => setPickerMode(null)}>
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black theme-text-main tracking-tight">
                {pickerMode === "source"
                  ? t("interbank.source_label")
                  : t("interbank.dest_label")}
              </h3>
              <p className="text-xs theme-text-secondary">
                {t("interbank.picker_sub")}
              </p>
            </div>
            <button
              onClick={() => setPickerMode(null)}
              className="p-2 theme-bubble-bg rounded-full theme-text-secondary active:scale-90"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3 pb-6">
            {visibleAccounts.map((acc) => {
              const isSelected =
                pickerMode === "source"
                  ? acc.id === sourceId
                  : acc.id === destId;
              return (
                <button
                  key={acc.id}
                  onClick={() => selectAccount(acc.id)}
                  className={`w-full flex items-center justify-between p-5 rounded-[28px] border transition-all active:scale-[0.98] ${isSelected ? "theme-primary-bg text-white border-transparent shadow-lg" : "theme-bubble-bg theme-text-main theme-border"}`}
                >
                  <div className="flex items-center gap-4">
                    <BankIcon
                      logoUrl={acc.provider === "piyes" ? logo : acc.logoUrl}
                      logoText={acc.logoText}
                      color={isSelected ? "rgba(255,255,255,0.2)" : acc.color}
                      size="md"
                      className={
                        isSelected ? "border border-white/30 shadow-none" : ""
                      }
                      id={acc.id}
                    />
                    <div className="text-left">
                      <p
                        className={`font-black text-sm ${isSelected ? "text-white" : "theme-text-main"}`}
                      >
                        {acc.label}
                      </p>
                      <p
                        className={`text-[10px] font-bold ${isSelected ? "text-white/60" : "theme-text-secondary"}`}
                      >
                        {acc.balance.toLocaleString("fr-HT")}{" "}
                        {t("currency.symbol")}
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check size={20} />}
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
};

const Loader2 = ({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default InterBankTransfer;