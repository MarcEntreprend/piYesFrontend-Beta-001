// pages/WithdrawFlow.tsx

import React, { useState, useEffect, useCallback } from "react";
/* Use react-router core for hooks */
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Wallet,
  FileText,
  Home,
  Landmark,
  Loader2,
  HelpCircle,
  MapPin,
  Search,
  ChevronRight,
  Clock,
  QrCode,
  AlertTriangle,
  X,
} from "lucide-react";
import { api } from "../services/apiService";
import { User } from "../shared/types";
import { useTranslation, useSecurity, useGlobalSync } from "../App";
import Modal from "../components/Modal";
import PinOverlay from "../components/PinOverlay";
import AccountSummary from "../components/AccountSummary";
import OperationResult from "../components/OperationResult";
import AiSupportChat from "../components/AiSupportChat";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import StepIndicator from "../components/StepIndicator";
import { MoneyInput } from "../components/MoneyInput";
import { displayMoney } from "../shared/money";
import { cacheService } from '../services/cacheService';

interface WithdrawFlowProps {
  user: User;
  onUpdateUser?: (user: User) => void;
}

type FlowStep = "amount" | "agent" | "pin" | "code";

const WithdrawFlow: React.FC<WithdrawFlowProps> = ({ user, onUpdateUser }) => {
  const { t } = useTranslation();
  const { triggerSensitiveAction, handleForgotPin } = useSecurity();
  const { refresh } = useGlobalSync();
  const [step, setStep] = useState<FlowStep>("amount");
  const [amount, setAmount] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: "success" | "failure";
    tx?: any;
    error?: string;
  } | null>(null);
  const [currentTx, setCurrentTx] = useState<any>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [withdrawalCode, setWithdrawalCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [searchQuery, setSearchQuery] = useState("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (step === "agent") {
      api.getAgents().then(setAgents);
    }
  }, [step]);

  useEffect(() => {
    let timer: any;
    if (step === "code" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && step === "code") {
      setResult({ status: "failure", error: t("withdraw.code_expired") });
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handleExitWarning = useCallback(
    (e: BeforeUnloadEvent) => {
      if (step === "code") {
        e.preventDefault();
        e.returnValue = "";
      }
    },
    [step],
  );

  useEffect(() => {
    window.addEventListener("beforeunload", handleExitWarning);
    return () => window.removeEventListener("beforeunload", handleExitWarning);
  }, [handleExitWarning]);

  const handleCancelWithdrawal = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    api.cancelWithdrawal("req-" + Date.now());
    navigate("/");
  };

  const handlePreWithdraw = () => {
    setStep("agent");
  };

  const handleSelectAgent = (agent: any) => {
    setSelectedAgent(agent);
    triggerSensitiveAction((pin) => {
      // Pass agent directly to avoid closure issues with React state
      handleWithdraw(agent, pin);
    });
  };

  const handleWithdraw = async (agent: any, pin?: string) => {
    setLoading(true);
    try {
      const withdrawAmount = parseFloat(amount);
      const tx = await api.withdraw(withdrawAmount, agent.name, pin);

      // Generate a fake withdrawal code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setWithdrawalCode(code);

      // Store transaction for later use in result
      setCurrentTx(tx);

      // Trigger global sync refresh to update balance everywhere
      await api.syncFresh();
      await refresh();
      cacheService.clearHistoryCache();
      sessionStorage.removeItem('piyes-history-state');

      setLoading(false);
      setStep("code");
    } catch (e: any) {
      setLoading(false);
      setResult({ status: "failure", error: e.message || t("common.error") });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (result)
    return (
      <OperationResult
        type="withdraw"
        status={result.status}
        amount={parseFloat(amount) || 0}
        reason={result.error}
        txId={result.tx?.id}
        authCode={result.tx?.auth_code}
        role="payer"
      />
    );

  return (
    <div className="theme-card-bg min-h-screen flex flex-col relative">
      <PageHeader
        title={step === "code" ? t("withdraw.code_title") : t("withdraw.title")}
        onBack={() => {
          if (step === "code") handleCancelWithdrawal();
          else if (step === "agent") setStep("amount");
          else navigate(-1);
        }}
        rightElement={
          <div
            className="w-10 h-10 rounded-full theme-bubble-bg flex items-center justify-center 
                  theme-text-secondary active:scale-90 transition-transform opacity-80 
                  hover:opacity-100"
          >
            <HelpCircle size={20} onClick={() => setShowSupport(true)} />
          </div>
        }
        className="sticky top-0 theme-card-bg z-20 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
      />

      <StepIndicator currentStep={step === "amount" ? 1 : 2} totalSteps={4} />

      {/*  Conteneur scrollable - permet au header de rester sticky */}
      <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
        <div className="px-6 flex flex-col pb-6 pt-6 flex-1">
          {step === "amount" && (
            <div className="flex-1 animate-in slide-in-from-right duration-300 flex flex-col">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-8 theme-text-main">
                  {t("withdraw.amount_q", {
                    currency: t("currency.name_plural"),
                  })}
                </h2>
                <div className="flex items-center border-b-2 theme-border pb-2 mb-10 focus-within:border-(--primary-color) transition-colors">
                  <span className="text-xl font-bold theme-text-secondary mr-2">
                    {t("currency.name_plural")}
                  </span>
                  <MoneyInput
                    autoFocus
                    value={amount ? parseFloat(amount) : undefined}
                    onValueChange={(val) => setAmount(val !== undefined ? val.toString() : "")}
                    placeholder="0,00"
                    className="w-full text-5xl font-bold outline-none bg-transparent theme-text-main"
                  />
                </div>

                <AccountSummary user={user} type="withdraw" amount={amount} />

                <div className="p-6 bg-orange-50 dark:bg-orange-900/10 rounded-[28px] flex gap-4 items-start border border-orange-100 dark:border-orange-900/20 shadow-sm mt-8">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shrink-0">
                    <Wallet size={20} />
                  </div>
                  <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed font-medium">
                    {t("withdraw.warning_msg")}
                  </p>
                </div>
              </div>

              <div className="pb-32 pt-6">
                <Button
                  fullWidth
                  disabled={
                    !amount ||
                    parseFloat(amount) <= 0 ||
                    parseFloat(amount) > user.balance ||
                    loading
                  }
                  onClick={handlePreWithdraw}
                >
                  {t("common.continue")}
                </Button>
              </div>
            </div>
          )}

          {step === "agent" && (
            <div className="flex-1 animate-in slide-in-from-right duration-300 flex flex-col">
              <div className="flex-1 space-y-6">
                <h2 className="text-2xl font-bold theme-text-main">
                  {t("withdraw.where_q")}
                </h2>

                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-secondary"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder={t("withdraw.search_placeholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full theme-bubble-bg pl-12 pr-4 py-4 rounded-2xl outline-none theme-text-main border theme-border focus:border-(--primary-color) transition-all"
                  />
                </div>

                <div className="space-y-3">
                  {filteredAgents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleSelectAgent(agent)}
                      disabled={agent.status === "closed"}
                      className="w-full theme-bubble-bg p-5 rounded-[28px] flex items-center gap-4 border theme-border active:scale-[0.98] transition-all disabled:opacity-50 text-left"
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${agent.type === "atm" ? "bg-blue-500" : "bg-green-500"} text-white`}
                      >
                        {agent.type === "atm" ? (
                          <Landmark size={24} />
                        ) : (
                          <MapPin size={24} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold theme-text-main">
                          {agent.name}
                        </p>
                        <p className="text-xs theme-text-secondary">
                          {agent.address} • {agent.distance}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <ChevronRight
                          size={20}
                          className="theme-text-secondary"
                        />
                        <span
                          className={`text-[10px] font-bold uppercase tracking-tighter ${agent.status === "open" ? "text-green-500" : "text-red-500"}`}
                        >
                          {agent.status === "open"
                            ? t("withdraw.status_open")
                            : t("withdraw.status_closed")}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "code" && (
            <div className="flex-1 animate-in zoom-in duration-300 flex flex-col items-center text-center space-y-8 pt-4">
              <div className="space-y-2">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 dark:bg-green-900/10 rounded-full mb-2">
                  <QrCode size={40} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-black theme-text-main">
                  {t("withdraw.present_code")}
                </h2>
                <p className="theme-text-secondary text-sm px-8">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t("withdraw.present_instruction", {
                        name: selectedAgent?.name,
                        amount,
                      }),
                    }}
                  />
                </p>
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-2xl border-4 border-gray-50 flex flex-col items-center gap-6 w-full max-w-75">
                <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${withdrawalCode}`}
                    alt="Withdrawal QR"
                    className="w-full h-full p-2"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black theme-text-secondary uppercase tracking-[0.2em]">
                    {t("withdraw.alphanumeric_code")}
                  </p>
                  <p className="text-4xl font-black theme-primary-text tracking-widest">
                    {withdrawalCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 theme-bubble-bg px-6 py-3 rounded-full border theme-border">
                <Clock
                  size={18}
                  className={
                    timeLeft < 60 ? "text-red-500" : "theme-primary-text"
                  }
                />
                <p
                  className={`font-black ${timeLeft < 60 ? "text-red-500" : "theme-text-main"}`}
                >
                  {t("request.expires_in")} {formatTime(timeLeft)}
                </p>
              </div>

              <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-[28px] flex gap-4 items-start border border-amber-100 dark:border-amber-900/20 shadow-sm w-full">
                <AlertTriangle
                  size={20}
                  className="text-amber-500 shrink-0 mt-0.5"
                />
                <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed font-bold text-left">
                  {t("withdraw.security_tip")}
                </p>
              </div>

              <div className="w-full pt-4">
                <Button
                  fullWidth
                  onClick={() =>
                    setResult({ status: "success", tx: currentTx })
                  }
                >
                  {t("withdraw.received_money")}
                </Button>
                <button
                  onClick={handleCancelWithdrawal}
                  className="w-full mt-4 text-red-500 font-bold text-sm flex items-center justify-center gap-2"
                >
                  <X size={16} /> {t("withdraw.cancel_btn")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <Modal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)}>
        <div className="p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold theme-text-main">
              {t("withdraw.exit_confirm_title")}
            </h3>
            <p className="text-sm theme-text-secondary">
              {t("withdraw.exit_confirm_desc")}
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={confirmExit}
              className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors"
            >
              {t("withdraw.confirm_exit")}
            </button>
            <button
              onClick={() => setShowExitConfirm(false)}
              className="w-full py-4 theme-bubble-bg theme-text-main rounded-2xl font-bold hover:opacity-80 transition-opacity"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </Modal>

      <AiSupportChat
        isOpen={showSupport}
        onClose={() => setShowSupport(false)}
        context={t("actions.withdraw")}
      />
    </div>
  );
};

export default WithdrawFlow;
