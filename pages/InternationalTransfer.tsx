// pages/InternationalTransfer.tsx

import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Globe2,
  ChevronRight,
  CheckCircle2,
  FileText,
  Home,
  Search,
  X,
  Landmark,
  Smartphone,
  Banknote,
  AlertCircle,
  Info,
  Clock,
  Check,
  HelpCircle,
} from "lucide-react";
import { api } from "../services/apiService";
import { User } from "../shared/types";
import { useTranslation, useGlobalSync } from "../App";
import Modal from "../components/Modal";
import PinOverlay from "../components/PinOverlay";
import OperationResult from "../components/OperationResult";
import { financeService } from "../services/financeService";
import AiSupportChat from "../components/AiSupportChat";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import StepIndicator from "../components/StepIndicator";

interface InternationalTransferProps {
  user: User;
  onUpdateUser?: (user: User) => void;
}

const InternationalTransfer: React.FC<InternationalTransferProps> = ({
  user,
  onUpdateUser,
}) => {
  const { t } = useTranslation();
  const { refresh } = useGlobalSync();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successTx, setSuccessTx] = useState<any>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  // Form State
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [recipientName, setRecipientName] = useState("");
  const [method, setMethod] = useState<"bank" | "cash" | "mobile">("bank");
  const [methodInfo, setMethodInfo] = useState("");
  const [amount, setAmount] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Pulling countries from centralized service
  const COUNTRIES = useMemo(
    () =>
      financeService.getInternationalCountries().map((c) => ({
        ...c,
        name: t(c.nameKey), // Resolve translation at UI level
      })),
    [t],
  );

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(searchCountry.toLowerCase()),
  );

  // Centralized math
  const conversion = useMemo(() => {
    return financeService.calculateIntlConversion(
      parseFloat(amount) || 0,
      selectedCountry?.id || "",
    );
  }, [amount, selectedCountry]);

  const handlePreSend = () => {
    const hasPin = !!localStorage.getItem("piyes-app-pin");
    if (hasPin) setIsVerifyingPin(true);
    else handleSend();
  };

  const handleSend = async () => {
    setIsVerifyingPin(false);
    setLoading(true);
    try {
      const transferAmount = parseFloat(amount);
      const res = await api.internationalTransfer({
        country: selectedCountry.name,
        amount: transferAmount,
        recipientName,
        method,
        methodInfo,
        currency: selectedCountry.currency,
        amountForeign: conversion.received,
        exchangeRate: conversion.rate,
      });

      const tx = {
        id: res.id,
        country: selectedCountry.name,
        auth_code: res.auth_code,
      };

      // Trigger global sync refresh
      await api.syncFresh();
      await refresh();

      setSuccessTx(tx);
    } catch (e) {
      alert(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  if (successTx)
    return (
      <OperationResult
        type="international"
        status="success"
        amount={parseFloat(amount)}
        recipientName={recipientName}
        txId={successTx.id}
        authCode={successTx.auth_code}
      />
    );

  return (
    <div className="theme-card-bg min-h-screen flex flex-col relative">
      {isVerifyingPin && (
        <PinOverlay
          mode="action"
          onCancel={() => setIsVerifyingPin(false)}
          onSuccess={handleSend}
          onFailure={() => navigate("/")}
        />
      )}

      <PageHeader
        title="piYès International"
        onBack={() => (step === 1 ? navigate(-1) : setStep(step - 1))}
        rightElement={
          <div
            className="w-10 h-10 rounded-full theme-bubble-bg flex items-center justify-center 
                    theme-text-secondary active:scale-90 transition-transform opacity-80 
                    hover:opacity-100"
          >
            <button onClick={() => setShowSupport(true)}>
              <HelpCircle size={20} />
            </button>
          </div>
        }
        className="sticky top-0 theme-card-bg z-20 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
      />

      {/* Indicateur d'étapes */}
      <StepIndicator currentStep={step} totalSteps={4} />

      <main className="flex-1 p-6 flex flex-col overflow-y-auto no-scrollbar">
        {step === 1 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-400">
            <div className="space-y-2">
              <h2 className="text-2xl font-black theme-text-main tracking-tight">
                {t("intl.step1_title")}
              </h2>
              <p className="text-sm theme-text-secondary">
                {t("intl.step1_sub")}
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                  {t("intl.country_label")}
                </label>
                <button
                  onClick={() => setShowCountryPicker(true)}
                  className="w-full flex items-center justify-between p-5 theme-bubble-bg rounded-[28px] border theme-border active:scale-[0.98] transition-all hover:border-(--primary-color)"
                >
                  <div className="flex items-center gap-3">
                    {selectedCountry ? (
                      <>
                        <img
                          src={selectedCountry.flag}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-sm"
                        />
                        <span className="font-bold theme-text-main">
                          {selectedCountry.name}
                        </span>
                      </>
                    ) : (
                      <span className="theme-text-secondary opacity-50">
                        {t("intl.country_placeholder")}
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    size={18}
                    className="theme-text-secondary opacity-30"
                  />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                  {t("intl.name_label")}
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder={
                    t("common.example") + " " + t("intl.example_name")
                  }
                  className="w-full p-5 theme-bubble-bg rounded-[28px] outline-none theme-text-main border theme-border focus:border-(--primary-color) transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                  {t("intl.method_label")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "bank",
                      icon: <Landmark size={18} />,
                      label: t("intl.methods.bank"),
                    },
                    {
                      id: "cash",
                      icon: <Banknote size={18} />,
                      label: t("intl.methods.cash"),
                    },
                    {
                      id: "mobile",
                      icon: <Smartphone size={18} />,
                      label: t("intl.methods.mobile"),
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id as any)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-3xl border transition-all text-center group active:scale-95 ${method === m.id ? "theme-primary-bg text-white border-transparent shadow-lg" : "theme-bubble-bg theme-text-secondary theme-border"}`}
                    >
                      <div
                        className={`${method === m.id ? "text-white" : "theme-primary-text"}`}
                      >
                        {m.icon}
                      </div>
                      <span className="text-[8px] font-black uppercase leading-tight tracking-tighter">
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                  {t("intl.info_label")}
                </label>
                <input
                  type="text"
                  value={methodInfo}
                  onChange={(e) => setMethodInfo(e.target.value)}
                  placeholder={
                    method === "bank"
                      ? t("intl.bank_placeholder")
                      : method === "mobile"
                        ? t("intl.mobile_placeholder")
                        : t("intl.cash_placeholder")
                  }
                  className="w-full p-5 theme-bubble-bg rounded-[28px] outline-none theme-text-main border theme-border focus:border-(--primary-color) transition-all font-mono text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in slide-in-from-right duration-400">
            <div className="space-y-2">
              <h2 className="text-2xl font-black theme-text-main tracking-tight">
                {t("intl.step2_title")}
              </h2>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 w-fit px-3 py-1.5 rounded-full">
                <img
                  src={selectedCountry?.flag}
                  alt=""
                  className="w-4 h-4 rounded-full"
                />
                <span className="text-[10px] font-bold theme-text-secondary uppercase tracking-wider">
                  {selectedCountry?.name} • {recipientName}
                </span>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex flex-col items-center py-6 border-b-2 theme-border focus-within:border-(--primary-color) transition-all">
                <label className="text-lg font-black theme-text-secondary mb-4 uppercase tracking-[0.2em]">
                  {t("intl.send_amount")}
                </label>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black theme-text-secondary">
                    {t("currency.symbol")}
                  </span>
                  <input
                    autoFocus
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t("transfer.amount_placeholder")}
                    className="w-full text-6xl font-black outline-none bg-transparent theme-text-main text-center placeholder-gray-200"
                  />
                </div>
              </div>

              {parseFloat(amount) > 0 && (
                <div className="p-8 theme-bubble-bg rounded-[40px] border theme-border space-y-5 relative overflow-hidden animate-in zoom-in duration-300">
                  <div className="absolute top-0 left-0 right-0 h-1 theme-primary-bg opacity-10"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                      {t("intl.exchange_rate")}
                    </span>
                    <span className="text-xs font-black theme-text-main">
                      1 {selectedCountry?.currency} = {conversion.rate}{" "}
                      {t("currency.symbol")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                      {t("intl.fees")} (1%)
                    </span>
                    <span className="text-xs font-black text-green-600">
                      -{conversion.fees.toLocaleString("fr-HT")}{" "}
                      {t("currency.symbol")}
                    </span>
                  </div>
                  <div className="h-px bg-gray-200 dark:bg-gray-800"></div>
                  <div className="flex justify-between items-end pt-2">
                    <span className="text-[10px] font-black theme-primary-text uppercase tracking-widest">
                      {t("intl.receive_amount")}
                    </span>
                    <span className="text-3xl font-black theme-primary-text">
                      {conversion.received.toLocaleString("en-US", {
                        style: "currency",
                        currency: selectedCountry?.currency || "USD",
                      })}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-5 theme-bubble-bg rounded-[28px] flex gap-4 items-center border theme-border shadow-sm">
                <div className="w-10 h-10 rounded-xl theme-card-bg flex items-center justify-center theme-primary-text shadow-sm border theme-border">
                  <Clock size={20} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black theme-text-secondary uppercase tracking-widest">
                    {t("intl.delivery_time")}
                  </p>
                  <p className="text-xs font-bold theme-text-main">
                    {t("intl.time_val")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-400">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black theme-text-main tracking-tight">
                {t("intl.step3_title")}
              </h2>
              <p className="text-sm theme-text-secondary">
                {t("intl.step3_desc")}
              </p>
            </div>

            <div className="theme-bubble-bg rounded-[48px] border theme-border overflow-hidden p-10 space-y-10 relative shadow-inner">
              <div className="absolute top-0 left-0 right-0 h-3 theme-primary-bg opacity-10"></div>

              <div className="flex flex-col items-center gap-3">
                <span className="text-[10px] font-black theme-text-secondary uppercase tracking-[0.2em]">
                  {t("intl.send_amount")}
                </span>
                <h3 className="text-5xl font-black theme-text-main">
                  {parseFloat(amount).toLocaleString("fr-HT")}{" "}
                  {t("currency.symbol")}
                </h3>
              </div>

              <div className="space-y-6 border-t theme-border pt-10">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                    {t("intl.name_label")}
                  </p>
                  <p className="text-sm font-bold theme-text-main">
                    {recipientName}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                    {t("intl.country_label")}
                  </p>
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedCountry?.flag}
                      alt=""
                      className="w-5 h-5 rounded-full border border-white/20"
                    />
                    <p className="text-sm font-bold theme-text-main">
                      {selectedCountry?.name}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                    {t("intl.method_label")}
                  </p>
                  <p className="text-sm font-bold theme-text-main capitalize">
                    {method}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                    {t("intl.info_label")}
                  </p>
                  <p className="text-sm font-mono font-bold theme-text-main bg-white dark:bg-black/20 px-3 py-1 rounded-lg border theme-border">
                    {methodInfo}
                  </p>
                </div>
              </div>

              <div className="pt-10 border-t theme-border">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black theme-primary-text uppercase tracking-widest">
                    {t("intl.receive_amount")}
                  </span>
                  <span className="text-3xl font-black theme-primary-text">
                    {conversion.received.toLocaleString("en-US", {
                      style: "currency",
                      currency: selectedCountry?.currency || "USD",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto pt-8 pb-32">
          <Button
            fullWidth
            isLoading={loading}
            disabled={
              (step === 1 &&
                (!selectedCountry ||
                  !recipientName ||
                  recipientName.length < 3 ||
                  !methodInfo)) ||
              (step === 2 &&
                (!amount ||
                  parseFloat(amount) <= 0 ||
                  parseFloat(amount) > user.balance))
            }
            onClick={() => {
              if (step === 1) setStep(2);
              else if (step === 2) setStep(3);
              else handlePreSend();
            }}
            rightIcon={!loading && <ChevronRight size={20} />}
          >
            {step === 3 ? t("intl.btn_send") : t("common.continue")}
          </Button>
        </div>
      </main>

      {/* Country Picker Modal */}
      <Modal
        isOpen={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
      >
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-2xl font-black theme-text-main tracking-tight">
                {t("intl.search_country")}
              </h3>
              <p className="text-[10px] font-bold theme-text-secondary uppercase tracking-widest">
                {t("intl.country_placeholder")}
              </p>
            </div>
            <button
              onClick={() => setShowCountryPicker(false)}
              className="p-2 theme-bubble-bg rounded-full theme-text-secondary hover:theme-primary-text transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative group">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 theme-text-secondary opacity-40 group-focus-within:theme-primary-text transition-colors"
              size={20}
            />
            <input
              type="text"
              value={searchCountry}
              onChange={(e) => setSearchCountry(e.target.value)}
              placeholder={t("intl.search_country")}
              className="w-full theme-bubble-bg p-5 pl-14 rounded-[28px] outline-none theme-text-main border-2 border-transparent focus:border-(--primary-color) transition-all font-bold"
            />
          </div>

          <div className="space-y-3 pb-10 max-h-[55vh] overflow-y-auto no-scrollbar">
            {filteredCountries.map((country) => (
              <button
                key={country.id}
                onClick={() => {
                  setSelectedCountry(country);
                  setShowCountryPicker(false);
                }}
                className={`w-full flex items-center justify-between p-5 rounded-4xl border transition-all active:scale-[0.98] group ${selectedCountry?.id === country.id ? "theme-primary-bg text-white border-transparent shadow-xl" : "theme-bubble-bg theme-text-main theme-border hover:theme-card-bg shadow-sm"}`}
              >
                <div className="flex items-center gap-5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden border-2 ${selectedCountry?.id === country.id ? "border-white/40" : "border-white shadow-md"}`}
                  >
                    <img
                      src={country.flag}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm">{country.name}</p>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-tight ${selectedCountry?.id === country.id ? "text-white/60" : "theme-text-secondary"}`}
                    >
                      {country.currency} • {t("intl.rate_label")}:{" "}
                      {country.rate} {t("currency.symbol")}
                    </p>
                  </div>
                </div>
                {selectedCountry?.id === country.id ? (
                  <Check size={20} />
                ) : (
                  <ChevronRight
                    size={16}
                    className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </Modal>
      <AiSupportChat
        isOpen={showSupport}
        onClose={() => setShowSupport(false)}
        context={t("actions.international")}
      />
    </div>
  );
};

export default InternationalTransfer;
