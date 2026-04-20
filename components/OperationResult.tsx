//components/OperationResult.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckCircle2, XCircle, FileText, Home, Clock } from "lucide-react";
import { useTranslation } from "../App";
import Button from "./Button";

interface OperationResultProps {
  type: "transfer" | "deposit" | "withdraw" | "international";
  status: "success" | "failure";
  amount: number;
  recipientName?: string; // Nom du destinataire ou de la banque
  reason?: string;
  txId?: string;
  role?: "payer" | "receiver";
  authCode?: string;
}

const OperationResult: React.FC<OperationResultProps> = ({
  type,
  status,
  amount,
  recipientName,
  reason,
  txId,
  role = "payer",
  authCode,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown === 0) {
      navigate("/");
    }
  }, [countdown, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isSuccess = status === "success";
  const currencyName =
    amount > 1 ? t("currency.name_plural") : t("currency.name");
  const formattedAmount = amount.toLocaleString("fr-HT");

  // Déterminer le nom du destinataire à afficher dans le récap
  const getDisplayRecipient = () => {
    if (recipientName) return recipientName;
    if (type === "deposit") return "Votre compte piYès";
    if (type === "withdraw") return "Votre agent piYès";
    if (type === "international") return "Transfert International";
    return "piYès Bank";
  };

  // Build dynamic message
  const getMessage = () => {
    if (isSuccess) {
      if (type === "transfer")
        return t("transfer.success_msg", {
          amount: formattedAmount,
          currency: currencyName,
        });
      if (type === "deposit") return t("deposit.success_sub");
      if (type === "withdraw") return t("withdraw.success_sub");
      if (type === "international") return t("intl.success_title");
    } else {
      const errorReason = reason || t("common.error");
      if (type === "transfer")
        return t("transfer.failure_msg", {
          amount: formattedAmount,
          currency: currencyName,
          reason: errorReason,
        });
      if (type === "deposit")
        return t("deposit.failure_msg", {
          amount: formattedAmount,
          currency: currencyName,
          reason: errorReason,
        });
      if (type === "withdraw")
        return t("withdraw.failure_msg", {
          amount: formattedAmount,
          currency: currencyName,
          reason: errorReason,
        });
      if (type === "international") return t("common.error");
    }
    return "";
  };

  return (
    <div className="fixed inset-0 z-100 theme-card-bg flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 w-full max-w-sm">
        <div className="relative mb-4">
          {isSuccess ? (
            <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
              <CheckCircle2 size={48} strokeWidth={2.5} />
            </div>
          ) : (
            <div className="rounded-full bg-red-50 dark:bg-red-900/10 p-4">
              <XCircle
                size={80}
                className="text-red-500 animate-in zoom-in duration-300"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black theme-text-main tracking-tight">
            {isSuccess ? t("common.success") : t("common.failure")}
          </h2>
          <p className="theme-text-secondary text-sm leading-relaxed max-w-xs mx-auto">
            {getMessage()}
          </p>
        </div>

        {/* Recap Box */}
        {isSuccess && (
          <div className="w-full theme-bubble-bg rounded-4xl p-6 my-4 border theme-border space-y-4 animate-in slide-in-from-bottom duration-700">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                {t("interbank.total_amount")}
              </span>
              <span className="text-lg font-black theme-primary-text">
                {formattedAmount} {t("currency.symbol")}
              </span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-gray-800"></div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                {t("receipt.receiver")}
              </span>
              <span className="text-sm font-black theme-text-main">
                {getDisplayRecipient()}
              </span>
            </div>
            {authCode && (
              <>
                <div className="h-px bg-gray-200 dark:bg-gray-800"></div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                    {t("intl.code_label")}
                  </span>
                  <span className="text-sm font-black theme-primary-text">
                    {authCode}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="w-full space-y-3 max-w-sm pb-8 mt-4">
        {isSuccess && txId && (
          <Button
            fullWidth
            onClick={() =>
              navigate(`/receipt/${txId}?type=${type}&role=${role}`)
            }
            leftIcon={<FileText size={20} />}
          >
            {t("transfer.view_receipt")}
          </Button>
        )}

        <Button
          variant="utility"
          fullWidth
          onClick={() => navigate("/")}
          leftIcon={<Home size={20} />}
        >
          {t("transfer.go_home")}
        </Button>

        <div className="flex items-center justify-center gap-2 text-[10px] font-bold theme-text-secondary uppercase tracking-widest opacity-60 mt-4">
          <Clock size={12} />
          <span>{t("common.auto_return", { seconds: countdown })}</span>
        </div>
      </div>
    </div>
  );
};

export default OperationResult;
