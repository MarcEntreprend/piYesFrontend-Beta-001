// pages\MobileRecharge.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Smartphone,
  ChevronRight,
  Search,
  User as UserIcon,
  CheckCircle2,
  Share2,
  Download,
  Phone,
  History as HistoryIcon,
  Loader2,
} from "lucide-react";
import { useTranslation, useToast, useSecurity, useGlobalSync } from "../App";
import { api } from "../services/apiService";
import { rechargeService, MobileOperator } from "../services/rechargeService";
import { Account, Contact, getInitials } from "../shared/types";
import Modal from "../components/Modal";
import BankIcon from "../components/BankIcon";
import PinOverlay from "../components/PinOverlay";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import StepIndicator from "../components/StepIndicator";
import { formatPhoneDisplay } from "../shared/phoneFormatter";
import { displayMoney, parseMoneyInputToCents } from "../shared/money";
import { MoneyInput } from "../components/MoneyInput";
import { cacheService } from "@/services/cacheService";

type Step = "number" | "amount" | "confirm" | "receipt";

const MobileRecharge: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { triggerSensitiveAction } = useSecurity();
  const { syncData, refresh } = useGlobalSync();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<Step>("number");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedOperator, setSelectedOperator] =
    useState<MobileOperator | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const accounts = useMemo(() => syncData?.accounts || [], [syncData]);
  const contacts = useMemo(() => syncData?.contacts || [], [syncData]);
  const user = syncData?.user;

  const operators = rechargeService.getOperators();
  const predefinedAmounts = rechargeService.getPredefinedAmounts();

  useEffect(() => {
    const currentAmount = amount || parseFloat(customAmount) || 0;
    if (selectedAccountId && currentAmount > 0) {
      const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
      if (selectedAccount && selectedAccount.balance < currentAmount) {
        setSelectedAccountId("");
      }
    }
  }, [amount, customAmount, selectedAccountId, accounts]);

  useEffect(() => {
    if (accounts.length > 0) {
      const accId = searchParams.get("accountId");
      if (accId && accounts.some((a) => a.id === accId)) {
        setSelectedAccountId(accId);
      } else {
        const piyesAccount = accounts.find((a) => a.provider === "piyes");
        setSelectedAccountId(piyesAccount?.id || accounts[0].id);
      }
    }
  }, [accounts, searchParams]);

  useEffect(() => {
    const detected = rechargeService.detectOperator(phoneNumber);
    setSelectedOperator(detected);
  }, [phoneNumber]);

  useEffect(() => {
    let timer: any;
    if (step === "receipt" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  useEffect(() => {
    if (step === "receipt" && countdown <= 0) {
      navigate("/");
    }
  }, [step, countdown, navigate]);

  const handleNextToAmount = () => {
    if (phoneNumber.length < 8) {
      showToast(t("common.error"), "error");
      return;
    }
    setStep("amount");
  };

  const handleNextToConfirm = () => {
    const finalAmount = amount || parseFloat(customAmount);
    if (!finalAmount || finalAmount <= 0) {
      showToast(t("common.error"), "error");
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = () => {
    triggerSensitiveAction((pin) => {
      executeRecharge(pin);
    });
  };

  const executeRecharge = async (pin?: string) => {
    setIsLoading(true);
    try {
      const finalAmount = amount || parseFloat(customAmount);
      const res = await api.recharge({
        phoneNumber,
        amount: finalAmount!,
        operatorId: selectedOperator?.id || "Mobile",
        accountId: selectedAccountId,
        pin,
      });
      setReceiptId(res.id);
      setStep("receipt");
      await refresh();
      cacheService.clearHistoryCache();
      sessionStorage.removeItem('piyes-history-state');
      showToast(t("recharge.success_msg"), "success");
    } catch (e: any) {
      console.error("Recharge error:", e);
      const errorMsg =
        e.response?.data?.error?.message || t("recharge.failure_msg");
      showToast(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRechargeMe = () => {
    if (user?.phone) {
      setPhoneNumber(user.phone);
    }
  };

  const isRechargeMeDisabled = !user?.phone;

  const handleSelectContact = (contact: Contact) => {
    if (contact.phone) {
      setPhoneNumber(contact.phone);
      setShowContactPicker(false);
    }
  };

  const renderStepNumber = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
      <div className="space-y-4">
        <label className="text-xs font-black theme-text-secondary uppercase tracking-widest ml-1">
          {t("recharge.step_number")}
        </label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 theme-primary-text">
            <Phone size={20} />
          </div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder={t("recharge.phone_placeholder")}
            className="w-full theme-bubble-bg theme-text-main py-5 pl-12 pr-4 rounded-3xl outline-none border-2 border-transparent focus:border-theme-primary transition-all font-bold text-lg shadow-inner"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRechargeMe}
            disabled={isRechargeMeDisabled}
            className="flex-1 theme-bubble-bg theme-text-main py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all border theme-border disabled:opacity-30 disabled:grayscale"
          >
            <UserIcon size={14} />
            {t("recharge.recharge_me")}
          </button>
          <button
            onClick={() => setShowContactPicker(true)}
            className="flex-1 theme-bubble-bg theme-text-main py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all border theme-border"
          >
            <Search size={14} />
            {t("recharge.select_contact")}
          </button>
        </div>
      </div>

      {selectedOperator && (
        <div className="theme-bubble-bg p-4 rounded-3xl border theme-border flex items-center gap-4 animate-in zoom-in duration-300">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg"
            style={{ backgroundColor: selectedOperator.color }}
          >
            {selectedOperator.name[0]}
          </div>
          <div>
            <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
              {t("recharge.operator_detected")}
            </p>
            <p className="font-bold theme-text-main text-lg">
              {selectedOperator.name}
            </p>
          </div>
        </div>
      )}

      <Button
        fullWidth
        onClick={handleNextToAmount}
        disabled={phoneNumber.length < 8}
        rightIcon={<ChevronRight size={20} />}
      >
        {t("common.continue")}
      </Button>
    </div>
  );

  const renderStepAmount = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right duration-300">
      <div className="space-y-4">
        <label className="text-xs font-black theme-text-secondary uppercase tracking-widest ml-1">
          {t("recharge.step_amount")}
        </label>

        <div className="grid grid-cols-3 gap-3">
          {predefinedAmounts.map((amt) => (
            <button
              key={amt}
              onClick={() => {
                setAmount(amt);
                setCustomAmount("");
              }}
              className={`py-4 rounded-2xl font-black transition-all active:scale-95 border-2 ${amount === amt
                ? "theme-primary-bg text-white border-transparent shadow-lg"
                : "theme-bubble-bg theme-text-main border-transparent"
                }`}
            >
              {amt} {t("currency.symbol")}
            </button>
          ))}
        </div>

        <div className="relative group">
          <MoneyInput
            value={customAmount ? parseFloat(customAmount) : undefined}
            onValueChange={(val) => {
              setCustomAmount(val !== undefined ? val.toString() : "");
              setAmount(null);
            }}
            placeholder={t("recharge.custom_amount")}
            maxValue={100000}
            showWarning={true}
            className="w-full theme-bubble-bg theme-text-main py-5 px-6 rounded-3xl outline-none border-2 border-transparent focus:border-theme-primary transition-all font-bold text-lg shadow-inner text-center"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 theme-text-secondary font-black pointer-events-none">
            {t("currency.symbol")}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest ml-1">
          {t("recharge.payment_method_subtitle") ||
            "Sélectionnez le mode de paiement"}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {accounts
            .filter((acc) => acc.balance > 0)
            .map((acc) => {
              const currentAmount = amount || parseFloat(customAmount) || 0;
              const isInsufficient =
                currentAmount > 0 && acc.balance < currentAmount;
              const isDisabled = currentAmount === 0 || isInsufficient;

              return (
                <button
                  key={acc.id}
                  disabled={isDisabled}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`px-3 py-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 w-full ${selectedAccountId === acc.id
                    ? "theme-primary-bg text-white border-transparent shadow-lg"
                    : "theme-bubble-bg theme-text-main border-transparent"
                    } ${isDisabled ? "opacity-50 grayscale-[0.5]" : "active:scale-95"}`}
                >
                  <BankIcon
                    logoUrl={acc.logoUrl}
                    logoText={acc.logoText}
                    color={acc.color}
                    size={"xs"}
                    className={
                      selectedAccountId === acc.id
                        ? "border border-white/20"
                        : ""
                    }
                  />
                  <div className="text-center">
                    <p className="text-[9px] font-black uppercase opacity-80 truncate w-full">
                      {acc.label}
                    </p>
                    <p
                      className={`text-[10px] font-bold ${isInsufficient ? "text-red-500" : ""}`}
                    >
                      {displayMoney(acc.balance * 100)} {t("currency.symbol")}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      <Button
        fullWidth
        onClick={handleNextToConfirm}
        disabled={(!amount && !customAmount) || !selectedAccountId}
        rightIcon={<ChevronRight size={20} />}
      >
        {t("common.continue")}
      </Button>
    </div>
  );

  const renderStepConfirm = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right duration-300">
      <div className="theme-bubble-bg p-8 rounded-[40px] border theme-border space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 theme-primary-bg opacity-5 blur-3xl -mr-16 -mt-16"></div>

        <div className="text-center space-y-2">
          <p className="text-xs font-black theme-text-secondary uppercase tracking-[0.2em]">
            {t("recharge.step_confirm")}
          </p>
          <h2 className="text-4xl font-black theme-text-main">
            {displayMoney((amount || parseFloat(customAmount)) * 100)}
            <span className="text-xl opacity-50">{t("currency.symbol")}</span>
          </h2>
        </div>

        <div className="space-y-4 pt-4 border-t theme-border border-dashed">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold theme-text-secondary">
              {t("recharge.phone_placeholder")}
            </span>
            <span className="font-black theme-text-main tracking-wider">
              {formatPhoneDisplay(phoneNumber)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold theme-text-secondary">
              {t("recharge.operator_detected")}
            </span>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedOperator?.color }}
              ></div>
              <span className="font-black theme-text-main">
                {selectedOperator?.name}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold theme-text-secondary">
              {t("interbank.source_label")}
            </span>
            <span className="font-black theme-text-main">
              {accounts.find((a) => a.id === selectedAccountId)?.label}
            </span>
          </div>
        </div>
      </div>

      <Button fullWidth onClick={handleConfirm} isLoading={isLoading}>
        {t("common.confirm")}
      </Button>
    </div>
  );

  const renderStepReceipt = () => (
    <div className="space-y-8 animate-in zoom-in duration-500">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 bg-green-500 text-white rounded-4xl flex items-center justify-center shadow-2xl shadow-green-500/20 animate-bounce">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black theme-text-main">
            {t("recharge.success_msg")}
          </h2>
          <p className="text-sm theme-text-secondary">
            {t("common.generated_on", {
              date: new Date().toLocaleDateString(),
              at: "",
              time: new Date().toLocaleTimeString(),
            })}
          </p>
        </div>
      </div>

      <div className="theme-bubble-bg p-6 rounded-4xl border theme-border space-y-4">
        <div className="flex justify-between items-center pb-4 border-b theme-border border-dashed">
          <span className="text-xs font-bold theme-text-secondary">
            {t("recharge.phone_placeholder")}
          </span>
          <span className="font-black theme-text-main tracking-wider">
            {formatPhoneDisplay(phoneNumber)}
          </span>
        </div>
        <div className="flex justify-between items-center pb-4 border-b theme-border border-dashed">
          <span className="text-xs font-bold theme-text-secondary">
            {t("recharge.operator_detected")}
          </span>
          <span className="font-black theme-text-main">
            {selectedOperator?.name}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold theme-text-secondary">
            {t("receipt.amount_label")}
          </span>
          <span className="text-xl font-black theme-text-main">
            {displayMoney((amount || parseFloat(customAmount)) * 100)}
            {t("currency.symbol")}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          variant="utility"
          fullWidth
          onClick={() =>
            navigate(`/receipt/${receiptId}?type=recharge&role=payer`)
          }
          leftIcon={<HistoryIcon size={18} />}
        >
          {t("recharge.view_receipt") || "Voir le reçu"}
        </Button>

        <Button fullWidth onClick={() => navigate("/")}>
          {t("recharge.done")}
        </Button>

        <p className="text-center text-[10px] theme-text-secondary font-bold uppercase tracking-widest">
          {t("recharge.redirect_msg", { countdown })}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen theme-bg flex flex-col pb-32">
      <PageHeader
        title={t("recharge.title")}
        onBack={() =>
          step === "number"
            ? navigate(-1)
            : setStep(
              step === "amount"
                ? "number"
                : step === "confirm"
                  ? "amount"
                  : "number",
            )
        }
      />

      {/* Indicateur d'étapes - 4 étapes = 3 barres */}
      <StepIndicator
        currentStep={
          step === "number"
            ? 1
            : step === "amount"
              ? 2
              : step === "confirm"
                ? 3
                : 4
        }
        totalSteps={4}
      />

      <div className="flex-1 px-6 mt-4">
        {step === "number" && renderStepNumber()}
        {step === "amount" && renderStepAmount()}
        {step === "confirm" && renderStepConfirm()}
        {step === "receipt" && renderStepReceipt()}
      </div>

      <Modal
        isOpen={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        type="bottom-sheet"
      >
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
          <h3 className="text-lg font-black theme-text-main mb-2">
            {t("recharge.select_contact")}
          </h3>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
            {contacts.filter((c) => c.phone).length > 0 ? (
              contacts
                .filter((c) => c.phone)
                .map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl theme-bubble-bg border theme-border active:scale-95 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-theme-primary/10 theme-primary-text flex items-center justify-center font-bold">
                      {getInitials(contact.name)}
                    </div>
                    <div className="text-left">
                      <p className="font-bold theme-text-main">
                        {contact.name}
                      </p>
                      <p className="text-xs theme-text-secondary tracking-wider">
                        {formatPhoneDisplay(contact.phone)}
                      </p>
                    </div>
                  </button>
                ))
            ) : (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 theme-bubble-bg rounded-full flex items-center justify-center mx-auto theme-text-secondary opacity-20">
                  <HistoryIcon size={32} />
                </div>
                <p className="text-sm theme-text-secondary">
                  {t("history.empty")}
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MobileRecharge;
