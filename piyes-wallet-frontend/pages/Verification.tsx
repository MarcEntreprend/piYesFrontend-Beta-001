import React, { useState } from "react";
/* Use react-router core for hooks */
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Search,
  ShieldCheck,
  ShieldX,
  Camera,
  ChevronRight,
  Share2,
  Download,
  ExternalLink,
} from "lucide-react";
import { api } from "../services/apiService";
import { useTranslation } from "../App";
import PageHeader from "../components/PageHeader";

const Verification: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [externalId, setExternalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (idToVerify?: string) => {
    const id = idToVerify || externalId;
    if (!id) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.verifyExternalId(id);
      setResult(data.receipt);
    } catch (e: any) {
      setError(e.message || t("common.error"));
    }
    setLoading(false);
  };

  const simulateScan = () => {
    alert("Simulation du scan camera...");
    setExternalId("ext_scanned_9988");
    handleVerify("ext_scanned_9988");
  };

  return (
    <div className="theme-card-bg min-h-screen pb-20">
      <PageHeader
        title={t("verification.title")}
        onBack={() => navigate(-1)}
        className="sticky top-0 theme-card-bg z-10 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
      />

      <div className="p-6 space-y-6">
        {!result ? (
          <div className="space-y-4 animate-in fade-in">
            <p className="text-sm theme-text-secondary">
              {t("verification.instructions")}
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-secondary"
                  size={20}
                />
                <input
                  type="text"
                  placeholder={t("verification.placeholder")}
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                  className="w-full theme-bubble-bg rounded-xl py-4 pl-10 pr-4 theme-text-main outline-none border-2 border-transparent focus:border-(--primary-color) transition-all"
                />
              </div>
              <button
                onClick={simulateScan}
                className="theme-bubble-bg border theme-border p-4 rounded-xl theme-primary-text active:scale-90 transition-transform shadow-sm"
              >
                <Camera size={24} />
              </button>
            </div>
            <button
              onClick={() => handleVerify()}
              disabled={loading || !externalId}
              className="w-full theme-primary-bg text-white py-4 rounded-full font-bold active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? t("common.loading") : t("verification.btn_verify")}
            </button>
          </div>
        ) : (
          <div className="animate-in zoom-in duration-300 space-y-6">
            <div className="p-6 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/20">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck size={32} className="text-green-600" />
                <div>
                  <h3 className="font-bold text-green-700 dark:text-green-400">
                    {t("verification.authentic_receipt")}
                  </h3>
                  <p className="text-[10px] text-green-600 uppercase tracking-widest font-bold">
                    {t("verification.status_label")} {result.status}
                  </p>
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="ml-auto p-1 theme-text-secondary"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-4 border-t border-green-100 dark:border-green-900/20 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs theme-text-secondary">
                    {t("receipt.amount_label")}
                  </span>
                  <span className="text-sm font-bold theme-text-main">
                    {result.amount.toLocaleString("fr-HT")} {result.currency}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs theme-text-secondary">
                    {t("receipt.date_label")}
                  </span>
                  <span className="text-sm font-bold theme-text-main">
                    {new Date(result.date).toLocaleDateString("fr-HT")}
                  </span>
                </div>

                {result.sender && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs theme-text-secondary">
                      {t("receipt.sender")}
                    </span>
                    <span className="text-sm font-bold theme-text-main">
                      {result.sender.name}
                    </span>
                  </div>
                )}
                {result.receiver && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs theme-text-secondary">
                      {t("receipt.receiver")}
                    </span>
                    <span className="text-sm font-bold theme-text-main">
                      {result.receiver.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-green-100 dark:border-green-900/20">
                <p className="text-[10px] font-bold theme-text-secondary uppercase mb-1">
                  {t("receipt.external_id")}
                </p>
                <p className="text-[10px] font-mono theme-text-main opacity-70 truncate">
                  {result.transaction_id}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 theme-bubble-bg theme-primary-text py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2">
                <Download size={16} /> PDF
              </button>
              <button className="flex-1 theme-bubble-bg theme-primary-text py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2">
                <Share2 size={16} /> {t("common.share")}
              </button>
            </div>
            <button
              onClick={() => setResult(null)}
              className="w-full text-center theme-text-secondary text-xs font-bold"
            >
              {t("verification.btn_retry")}
            </button>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex flex-col items-center text-center animate-in zoom-in">
            <ShieldX size={48} className="text-red-500 mb-4" />
            <h3 className="font-bold text-red-700">
              {t("verification.invalid_id")}
            </h3>
            <p className="text-xs text-red-600 mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 text-xs font-bold theme-text-secondary"
            >
              {t("common.retry")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const XCircle: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className,
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
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);

export default Verification;
