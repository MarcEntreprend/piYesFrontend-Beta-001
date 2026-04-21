// pages/Report.tsx

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileText,
  Table,
  TrendingUp,
  TrendingDown,
  History as HistoryIcon,
  Info,
  CheckCircle2,
  Users,
  Clock,
  Zap,
  BarChart2,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  ChevronRight,
  Star,
  DollarSign,
  Percent,
  Award,
  Target,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api } from "../services/apiService";
import { useTranslation } from "../App";
import Button from "../components/Button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TopSender {
  name: string;
  amount: number;
  count: number;
}
interface HourData {
  hour: number;
  amount: number;
  count: number;
}
interface TypeData {
  type: string;
  amount: number;
  count: number;
}
interface ReportData {
  period: string;
  totalReceived: number;
  totalSent: number;
  netBalance: number;
  transactionCount: number;
  receivedCount: number;
  sentCount: number;
  previousPeriodReceived: number;
  previousPeriodSent: number;
  topSenders: TopSender[];
  byHour: HourData[];
  byType: TypeData[];
  avgTransactionAmount: number;
  totalFeesPaid: number;
  frequencyBreakdown: { once: number; repeat: number; frequent: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtAmt = (n: number) =>
  n.toLocaleString("fr-HT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const pctChange = (
  curr: number,
  prev: number,
): { value: number; positive: boolean } => {
  if (!prev) return { value: 0, positive: true };
  const v = ((curr - prev) / prev) * 100;
  return { value: Math.abs(Math.round(v)), positive: v >= 0 };
};

const TYPE_LABELS: Record<string, string> = {
  TRANSFER: "Transfert P2P",
  DEPOSIT: "Dépôt",
  WITHDRAW: "Retrait",
  RECHARGE: "Recharge",
  INTERNATIONAL: "International",
  REQUEST: "Demande",
  SCHEDULED: "Planifié",
  CARD_PAYMENT: "Carte",
};

const TYPE_COLORS = [
  "#830AD1",
  "#3390EC",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`shimmer rounded-2xl ${className}`} />
);

const StatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; positive: boolean };
}> = ({ label, value, sub, icon, color, trend }) => (
  <div
    className={`p-5 rounded-[28px] border theme-border space-y-3 theme-bubble-bg`}
  >
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
        {label}
      </span>
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
    </div>
    <p className="text-2xl font-black theme-text-main">{value}</p>
    {(sub || trend) && (
      <div className="flex items-center gap-2">
        {trend && (
          <span
            className={`text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full ${
              trend.positive
                ? "bg-green-500/10 text-green-500"
                : "bg-red-500/10 text-red-500"
            }`}
          >
            {trend.positive ? (
              <TrendingUp size={10} />
            ) : (
              <TrendingDown size={10} />
            )}
            {trend.value}%
          </span>
        )}
        {sub && <span className="text-[10px] theme-text-secondary">{sub}</span>}
      </div>
    )}
  </div>
);

// Custom tooltip for recharts
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-(--card-bg) border border-(--border-color) rounded-xl p-3 shadow-xl text-xs">
        <p className="font-black text-(--text-main)">{label}h</p>
        <p className="text-(--primary-color) font-bold">
          {fmtAmt(payload[0].value)} G.
        </p>
      </div>
    );
  }
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Report: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<
    "month" | "3months" | "6months" | "year" | "custom"
  >("month");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [generationDate] = useState(new Date());
  const [infoModal, setInfoModal] = useState<{
    title: string;
    body: string;
  } | null>(null);

  // ── Export bancaire : modal de choix de période ──────────────────────────
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "xlsx" | null>(null);
  const [exportMonth, setExportMonth] = useState(new Date().getMonth());
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const exportYears = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => y - i);
  }, []);

  const PERIOD_OPTIONS: {
    id: "month" | "3months" | "6months" | "year" | "custom";
    label: string;
  }[] = [
    { id: "month", label: t("reports.periods.this_month") },
    { id: "3months", label: t("reports.periods.three_months") },
    { id: "6months", label: t("reports.periods.six_months") },
    { id: "year", label: t("reports.periods.this_year") },
  ];

  const exportMonths = [
    t("months.january"),
    t("months.february"),
    t("months.march"),
    t("months.april"),
    t("months.may"),
    t("months.june"),
    t("months.july"),
    t("months.august"),
    t("months.september"),
    t("months.october"),
    t("months.november"),
    t("months.december"),
  ];

  const TYPE_LABELS_LOCALIZED: Record<string, string> = {
    TRANSFER: t("reports.types.p2p"),
    DEPOSIT: t("reports.types.deposit"),
    WITHDRAW: t("reports.types.withdraw"),
    RECHARGE: t("reports.types.recharge"),
    INTERNATIONAL: t("reports.types.intl"),
    REQUEST: t("reports.types.request"),
    SCHEDULED: t("reports.types.scheduled"),
    CARD_PAYMENT: t("reports.types.card"),
  };

  useEffect(() => {
    if (period !== "custom") fetchReport();
  }, [period]);

  // Adapter fetchReport
  const fetchReport = async () => {
    setLoading(true);
    try {
      const params =
        period === "custom" && customFrom && customTo
          ? `custom&from=${customFrom}&to=${customTo}`
          : period;
      const data = await api.getReportSummary(params);
      setReportData(data);
    } catch (e) {
      console.error("Report fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived data ────────────────────────────────────────────────────────────
  const receivedTrend = useMemo(
    () =>
      reportData
        ? pctChange(reportData.totalReceived, reportData.previousPeriodReceived)
        : null,
    [reportData],
  );

  const sentTrend = useMemo(
    () =>
      reportData
        ? pctChange(reportData.totalSent, reportData.previousPeriodSent)
        : null,
    [reportData],
  );

  // Peak hour
  const peakHour = useMemo(() => {
    if (!reportData) return null;
    return reportData.byHour.reduce(
      (max, h) => (h.amount > max.amount ? h : max),
      reportData.byHour[0],
    );
  }, [reportData]);

  // Bar chart data — only show hours 6–22
  const hourChartData = useMemo(
    () =>
      reportData?.byHour
        .filter((h) => h.hour >= 6 && h.hour <= 22)
        .map((h) => ({
          hour: h.hour,
          amount: h.amount,
        })) ?? [],
    [reportData],
  );

  // Pie data
  const pieData = useMemo(
    () =>
      (reportData?.byType ?? []).map((d, i) => ({
        name: TYPE_LABELS_LOCALIZED[d.type] ?? d.type,
        value: d.amount,
        color: TYPE_COLORS[i % TYPE_COLORS.length],
      })),
    [reportData, TYPE_LABELS_LOCALIZED],
  );

  // ── Déclenche l'ouverture du modal de période au clic sur PDF ou CSV ────
  const handleExport = (format: string) => {
    setExportFormat(format as "pdf" | "xlsx");
    setShowExportModal(true);
  };

  // ── Génère et télécharge le relevé bancaire après choix de la période ───
  const handleGenerateStatement = async () => {
    if (!exportFormat) return;
    setExporting(exportFormat);
    setShowExportModal(false);

    try {
      // Récupérer les infos user/compte depuis le sync
      const syncData = (await api.syncFresh) ? api.syncFresh() : api.sync();
      const syncResp = await syncData;
      const currentUser = syncResp.user;
      const piyesAccount = syncResp.accounts.find(
        (a: any) => a.provider === "piyes",
      );
      const accountNumber =
        piyesAccount?.accountNumber || currentUser.accountNumber || "—";

      // Début et fin réels du mois choisi
      const startDate = new Date(exportYear, exportMonth, 1);
      const endDate = new Date(exportYear, exportMonth + 1, 0, 23, 59, 59);
      const startStr = startDate.toISOString();
      const endStr = endDate.toISOString();

      // Récupérer toutes les transactions du mois (limite haute)
      const allTx: any[] = await api.getHistory({ limit: 500 });
      // Filtrer par mois choisi ET par compte piYès uniquement
      const txs = allTx.filter((tx: any) => {
        const d = new Date(tx.date);
        return (
          d >= startDate && d <= endDate && !["INTERNATIONAL"].includes(tx.type)
        );
      });

      // Trier par date croissante
      txs.sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // Calculer le solde final (somme nette des transactions)
      const balance = txs.reduce((acc: number, tx: any) => {
        return acc + (tx.role === "RECEIVER" ? tx.amount : -tx.amount);
      }, 0);

      const formatDay = (dateStr: string) => {
        const d = new Date(dateStr);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      };

      const periodStart = `01/${String(exportMonth + 1).padStart(2, "0")}/${exportYear}`;
      const periodEnd = `${String(endDate.getDate()).padStart(2, "0")}/${String(exportMonth + 1).padStart(2, "0")}/${exportYear}`;
      const now = new Date();
      const genDate = formatDay(now.toISOString());
      const genTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const authCode = "ABCD-1234-EFGH-5678"; // Mock pour MVP

      if (exportFormat === "xlsx") {
        // ── CSV/Excel ──────────────────────────────────────────────────────
        const sep = ",";
        const q = (s: any) => `"${String(s ?? "").replace(/"/g, '""')}"`;

        const rows: string[] = [
          // Ligne 1 : en-tête institution
          [
            q("piyes"),
            q("relevé bancaire"),
            q(accountNumber),
            q("Utilisateur:"),
            q(currentUser.name),
            q(`Compte : ${currentUser.accountType || "individual"}`),
          ].join(sep),
          // Ligne 2 : période
          [
            q(""),
            q("periode"),
            q(periodStart),
            q("à"),
            q(periodEnd),
            q(""),
          ].join(sep),
          // Ligne 3 : entêtes colonnes (sans titre pour col 1 et col 5)
          [
            q(""),
            q("jour"),
            q("ID de transaction"),
            q("type + role + contrepartie"),
            q(""),
            q("montant"),
          ].join(sep),
          // Transactions
          ...txs.map((tx: any, i: number) =>
            [
              q(i + 1),
              q(formatDay(tx.date)),
              q(tx.external_id || "—"),
              q(`${tx.type}, ${tx.role}, ${tx.counterpartyName}`),
              q(tx.role === "RECEIVER" ? "+" : "-"),
              q(
                tx.amount.toLocaleString("fr-HT", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
              ),
            ].join(sep),
          ),
          // Ligne vide
          [q(""), q(""), q(""), q(""), q(""), q("")].join(sep),
          // Ligne balance
          [
            q(txs.length + 1),
            q(periodEnd),
            q("-"),
            q("Balance"),
            q("="),
            q(
              balance.toLocaleString("fr-HT", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            ),
          ].join(sep),
          // Ligne authenticité
          [
            q("Rapport généré le"),
            q(genDate),
            q("à"),
            q(genTime),
            q("code d'authenticité :"),
            q(authCode),
          ].join(sep),
        ];

        const csv = "\uFEFF" + rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `piyes-releve-${exportYear}-${String(exportMonth + 1).padStart(2, "0")}.csv`;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (exportFormat === "pdf") {
        // ── PDF via tableau HTML rendu ─────────────────────────────────────
        const tableHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <style>
              * { font-family: Arial, sans-serif; font-size: 11px; color: #111; }
              body { padding: 24px; background: #fff; }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
              th { background: #f4f4f4; font-weight: bold; }
              .header-row td { background: #830AD1; color: white; font-weight: bold; }
              .period-row td { background: #f9f6ff; }
              .balance-row td { font-weight: bold; background: #f0f0f0; }
              .auth-row td { font-size: 9px; color: #666; background: #fafafa; }
              .amount-col { text-align: right; }
              .sign-col { text-align: center; font-weight: bold; }
              .plus { color: #16a34a; }
              .minus { color: #dc2626; }
            </style>
          </head>
          <body>
            <table>
              <tr class="header-row">
                <td>piYès</td>
                <td>Relevé bancaire</td>
                <td>${accountNumber}</td>
                <td>Utilisateur :</td>
                <td>${currentUser.name}</td>
                <td>Compte : ${currentUser.accountType || "individual"}</td>
              </tr>
              <tr class="period-row">
                <td></td>
                <td><strong>Période</strong></td>
                <td>${periodStart}</td>
                <td>à</td>
                <td>${periodEnd}</td>
                <td></td>
              </tr>
              <tr>
                <th></th>
                <th>Jour</th>
                <th>ID Transaction</th>
                <th>Type · Rôle · Contrepartie</th>
                <th></th>
                <th class="amount-col">Montant (G.)</th>
              </tr>
              ${txs
                .map((tx: any, i: number) => {
                  const isIn = tx.role === "RECEIVER";
                  return `<tr>
                  <td>${i + 1}</td>
                  <td>${formatDay(tx.date)}</td>
                  <td>${tx.external_id || "—"}</td>
                  <td>${tx.type}, ${tx.role}, ${tx.counterpartyName}</td>
                  <td class="sign-col ${isIn ? "plus" : "minus"}">${isIn ? "+" : "−"}</td>
                  <td class="amount-col">${tx.amount.toLocaleString("fr-HT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>`;
                })
                .join("")}
              <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
              <tr class="balance-row">
                <td>${txs.length + 1}</td>
                <td>${periodEnd}</td>
                <td>—</td>
                <td>Balance</td>
                <td class="sign-col">=</td>
                <td class="amount-col">${balance.toLocaleString("fr-HT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr class="auth-row">
                <td>Rapport généré le</td>
                <td>${genDate}</td>
                <td>à</td>
                <td>${genTime}</td>
                <td>Code d'authenticité :</td>
                <td>${authCode}</td>
              </tr>
            </table>
          </body>
          </html>
        `;

        // Ouvrir dans un nouvel onglet et déclencher l'impression PDF
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(tableHtml);
          win.document.close();
          win.focus();
          setTimeout(() => {
            win.print();
            // win.close(); // Optionnel : fermer après impression
          }, 500);
        }
      }
    } catch (e) {
      console.error("Export statement error:", e);
      alert("Erreur lors de la génération du relevé");
    } finally {
      setExporting(null);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading && !reportData) {
    return (
      <div className="theme-card-bg min-h-screen pb-24">
        <header className="px-6 pt-12 pb-6 border-b theme-border sticky top-0 theme-card-bg z-10 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 theme-text-secondary"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold theme-text-main">
            {t("reports.labels.report_title")}
          </h1>
        </header>
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!loading && !reportData) {
    return (
      <div className="theme-card-bg min-h-screen flex flex-col">
        <header className="px-6 pt-12 pb-6 border-b theme-border sticky top-0 theme-card-bg z-10 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 theme-text-secondary"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold theme-text-main">
            {t("reports.labels.report_title")}
          </h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-12 opacity-40">
          <BarChart2 size={48} className="theme-text-secondary" />
          <p className="text-sm font-bold theme-text-secondary text-center">
            {t("reports.labels.no_data")}
          </p>
        </div>
      </div>
    );
  }

  const d = reportData!;

  return (
    <div
      className="theme-card-bg min-h-screen pb-24 animate-in fade-in duration-500"
      ref={reportRef}
    >
      {/* ── Info Modal ─────────────────────────────────────────────────────── */}
      {infoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
          onClick={() => setInfoModal(null)}
        >
          <div
            className="w-full max-w-sm theme-card-bg rounded-4xl p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 theme-primary-bg rounded-2xl flex items-center justify-center shrink-0">
                <Info size={18} className="text-white" />
              </div>
              <button
                onClick={() => setInfoModal(null)}
                className="p-2 theme-bubble-bg rounded-full theme-text-secondary text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <h3 className="text-base font-black theme-text-main">
              {infoModal.title}
            </h3>
            <p className="text-sm theme-text-secondary leading-relaxed">
              {infoModal.body}
            </p>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="px-6 pt-12 pb-6 border-b theme-border sticky top-0 theme-card-bg z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 theme-text-secondary active:scale-90 transition-transform"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold theme-text-main">
              {t("reports.labels.report_title")}
            </h1>
            <p className="text-[10px] theme-text-secondary">
              {t("reports.labels.generated_on")}{" "}
              {generationDate.toLocaleDateString(t("intl.locale"))}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/transfer-interactions")}
          className="flex items-center gap-1.5 theme-bubble-bg rounded-full px-3 py-1.5 border theme-border active:scale-95 transition-all"
        >
          <HistoryIcon size={12} className="theme-primary-text" />
          <span className="text-[10px] font-black theme-primary-text">
            {t("reports.labels.interactions_btn")}
          </span>
        </button>
      </header>

      <div className="p-6 space-y-8">
        {/* ── Period selector ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setPeriod(opt.id);
                  setShowDatePicker(false);
                }}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 ${
                  period === opt.id
                    ? "theme-primary-bg text-white shadow-lg"
                    : "theme-bubble-bg theme-text-secondary border theme-border"
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => {
                setShowDatePicker(!showDatePicker);
                if (!showDatePicker) setPeriod("custom");
              }}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 ${
                period === "custom"
                  ? "theme-primary-bg text-white shadow-lg"
                  : "theme-bubble-bg theme-text-secondary border theme-border"
              }`}
            >
              <Clock size={12} /> {t("reports.labels.custom")}
            </button>
          </div>

          {showDatePicker && (
            <div className="theme-bubble-bg rounded-3xl border theme-border p-4 space-y-3 animate-in slide-in-from-top duration-200">
              <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                {t("reports.labels.custom_range")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold theme-text-secondary uppercase">
                    {t("reports.labels.from")}
                  </label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full theme-card-bg border theme-border rounded-xl px-3 py-2 text-xs font-bold theme-text-main outline-none focus:border-(--primary-color) transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold theme-text-secondary uppercase">
                    {t("reports.labels.to")}
                  </label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full theme-card-bg border theme-border rounded-xl px-3 py-2 text-xs font-bold theme-text-main outline-none focus:border-(--primary-color) transition-all"
                  />
                </div>
              </div>
              <Button
                onClick={() => {
                  if (customFrom && customTo) {
                    fetchReport();
                    setShowDatePicker(false);
                  }
                }}
                disabled={!customFrom || !customTo}
                variant="primary"
                fullWidth
                className="py-3 rounded-2xl text-xs font-black"
              >
                {t("reports.labels.apply")}
              </Button>
            </div>
          )}
        </div>

        {/* ── SECTION 1 — Vue d'ensemble ──────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 theme-primary-bg rounded-full" />
            <h2 className="text-xs font-black theme-text-secondary uppercase tracking-widest">
              {t("reports.labels.overview_title")}
            </h2>
          </div>

          {/* Solde net — hero card cliquable */}
          <div
            className="theme-primary-bg rounded-4xl p-6 space-y-4 relative overflow-hidden shadow-xl cursor-pointer active:scale-[0.99] transition-all"
            onClick={() =>
              setInfoModal({
                title: t("reports.labels.net_balance_period"),
                body: t("reports.labels.net_balance_help"),
              })
            }
          >
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -right-4 bottom-0 w-20 h-20 rounded-full bg-white/5" />
            <div className="relative space-y-1">
              <p className="text-xs font-black text-white/60 uppercase tracking-widest">
                {t("reports.labels.net_balance_period")}
              </p>
              <p className="text-4xl font-black text-white">
                {d.netBalance >= 0 ? "+" : ""}
                {fmtAmt(d.netBalance)}{" "}
                <span className="text-xl opacity-60">G.</span>
              </p>
            </div>
            <div className="relative flex gap-4">
              <div className="flex-1 bg-white/10 rounded-2xl p-3 space-y-1">
                <p className="text-[9px] text-white/60 font-bold uppercase">
                  {t("reports.labels.received")}
                </p>
                <p className="text-sm font-black text-white">
                  {fmtAmt(d.totalReceived)} G.
                </p>
                {receivedTrend && (
                  <span
                    className={`text-[9px] font-bold flex items-center gap-0.5 ${receivedTrend.positive ? "text-green-300" : "text-red-300"}`}
                  >
                    {receivedTrend.positive ? (
                      <TrendingUp size={9} />
                    ) : (
                      <TrendingDown size={9} />
                    )}
                    {receivedTrend.value}% {t("reports.labels.vs_prev_period")}
                  </span>
                )}
              </div>
              <div className="flex-1 bg-white/10 rounded-2xl p-3 space-y-1">
                <p className="text-[9px] text-white/60 font-bold uppercase">
                  {t("reports.labels.spent")}
                </p>
                <p className="text-sm font-black text-white">
                  {fmtAmt(d.totalSent)} G.
                </p>
                {sentTrend && (
                  <span
                    className={`text-[9px] font-bold flex items-center gap-0.5 ${!sentTrend.positive ? "text-green-300" : "text-red-300"}`}
                  >
                    {sentTrend.positive ? (
                      <TrendingUp size={9} />
                    ) : (
                      <TrendingDown size={9} />
                    )}
                    {sentTrend.value}% {t("reports.labels.vs_prev_period")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4 stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() =>
                setInfoModal({
                  title: t("reports.labels.transactions_received"),
                  body: t("reports.labels.transactions_received_help"),
                })
              }
            >
              <StatCard
                label={t("reports.labels.transactions_received")}
                value={String(d.receivedCount)}
                icon={<ArrowDownLeft size={16} className="text-green-500" />}
                color="bg-green-500/10"
                sub={`${fmtAmt(d.totalReceived / Math.max(d.receivedCount, 1))} ${t("reports.labels.avg_currency")}`}
              />
            </div>
            <div
              onClick={() =>
                setInfoModal({
                  title: t("reports.labels.transactions_sent"),
                  body: t("reports.labels.transactions_sent_help"),
                })
              }
            >
              <StatCard
                label={t("reports.labels.transactions_sent")}
                value={String(d.sentCount)}
                icon={<ArrowUpRight size={16} className="text-red-400" />}
                color="bg-red-500/10"
                sub={`${fmtAmt(d.totalSent / Math.max(d.sentCount, 1))} ${t("reports.labels.avg_currency")}`}
              />
            </div>
            <div
              onClick={() =>
                setInfoModal({
                  title: t("reports.labels.total_transactions"),
                  body: t("reports.labels.total_transactions_help"),
                })
              }
            >
              <StatCard
                label={t("reports.labels.total_transactions")}
                value={String(d.transactionCount)}
                icon={<Zap size={16} className="theme-primary-text" />}
                color="theme-bubble-bg"
              />
            </div>
            <div
              onClick={() =>
                setInfoModal({
                  title: t("reports.labels.avg_amount"),
                  body: t("reports.labels.avg_amount_help"),
                })
              }
            >
              <StatCard
                label={t("reports.labels.avg_amount")}
                value={`${fmtAmt(d.avgTransactionAmount)} G.`}
                icon={<Target size={16} className="theme-primary-text" />}
                color="theme-bubble-bg"
              />
            </div>
          </div>
        </section>

        {/* ── SECTION 2 — Flux entrants ───────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-green-500 rounded-full" />
            <h2 className="text-xs font-black theme-text-secondary uppercase tracking-widest">
              {t("reports.labels.inflow")}
            </h2>
          </div>

          {/* Top 5 payeurs */}
          {d.topSenders.length > 0 ? (
            <div
              className="theme-bubble-bg rounded-[28px] border theme-border overflow-hidden cursor-pointer"
              onClick={() =>
                setInfoModal({
                  title: t("reports.labels.top_payers_title"),
                  body: t("reports.labels.top_payers_help"),
                })
              }
            >
              <div className="px-5 pt-5 pb-2 flex items-center justify-between">
                <p className="text-xs font-black theme-text-main flex items-center gap-2">
                  <Users size={14} className="theme-primary-text" />{" "}
                  {t("reports.labels.top")} {Math.min(d.topSenders.length, 5)}{" "}
                  {t("reports.labels.payers")}
                </p>
                <span className="text-[9px] theme-text-secondary font-bold uppercase">
                  {PERIOD_OPTIONS.find((p) => p.id === period)?.label}
                </span>
              </div>
              {d.topSenders.slice(0, 5).map((sender) => {
                const maxAmt = d.topSenders[0].amount;
                const pct = Math.round((sender.amount / maxAmt) * 100);
                const freqLabel =
                  sender.count === 1
                    ? "1×"
                    : sender.count <= 4
                      ? `${sender.count}×`
                      : `${sender.count}× ⭐`;
                return (
                  <div
                    key={sender.name}
                    className="px-5 py-3 border-t theme-border"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full theme-primary-bg text-white flex items-center justify-center text-xs font-black shrink-0">
                        {sender.name
                          .split(" ")
                          .map((w: string) => w[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold theme-text-main truncate">
                          {sender.name}
                        </p>
                        <p className="text-[9px] theme-text-secondary">
                          {sender.count}×{" "}
                          {t("reports.labels.transaction_singular")}
                          {sender.count > 1 ? "s" : ""}
                        </p>
                      </div>
                      <p className="text-sm font-black theme-text-main shrink-0">
                        {fmtAmt(sender.amount)} G.
                      </p>
                    </div>
                    <div className="h-1.5 bg-(--border-color) rounded-full overflow-hidden">
                      <div
                        className="h-full theme-primary-bg rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="px-5 py-4 border-t theme-border flex gap-3">
                <div className="flex-1 text-center">
                  <p className="text-lg font-black theme-text-main">
                    {d.frequencyBreakdown.once}
                  </p>
                  <p className="text-[9px] theme-text-secondary">
                    {t("reports.labels.uniques")}
                  </p>
                </div>
                <div className="w-px bg-(--border-color)" />
                <div className="flex-1 text-center">
                  <p className="text-lg font-black theme-text-main">
                    {d.frequencyBreakdown.repeat}
                  </p>
                  <p className="text-[9px] theme-text-secondary">
                    {t("reports.labels.regulars")}
                  </p>
                </div>
                <div className="w-px bg-(--border-color)" />
                <div className="flex-1 text-center">
                  <p className="text-lg font-black text-amber-500">
                    {d.frequencyBreakdown.frequent}
                  </p>
                  <p className="text-[9px] theme-text-secondary">
                    {t("reports.labels.loyals")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="theme-bubble-bg rounded-[28px] border theme-border p-8 text-center opacity-40">
              <Users size={32} className="mx-auto mb-2 theme-text-secondary" />
              <p className="text-xs theme-text-secondary">
                {t("reports.labels.no_payments_received")}
              </p>
            </div>
          )}

          {/* Heure de pointe */}
          {hourChartData.some((h) => h.amount > 0) && (
            <div
              className="theme-bubble-bg rounded-[28px] border theme-border p-5 space-y-4 cursor-pointer"
              onClick={() =>
                setInfoModal({
                  title: t("reports.labels.peak_hours_title"),
                  body: t("reports.labels.peak_hours_help"),
                })
              }
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-black theme-text-main flex items-center gap-2">
                  <Clock size={14} className="theme-primary-text" />{" "}
                  {t("reports.labels.peak_hours_title")}
                </p>
                {peakHour && peakHour.amount > 0 && (
                  <span className="text-[9px] theme-bubble-bg theme-primary-text font-black px-2 py-1 rounded-full border theme-border">
                    {t("reports.labels.peak")} {peakHour.hour}h
                  </span>
                )}
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hourChartData}
                    margin={{ top: 0, right: 0, left: -32, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="hour"
                      tick={{
                        fontSize: 9,
                        fill: "var(--text-secondary)",
                        fontWeight: 700,
                      }}
                      tickFormatter={(h) => `${h}h`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      content={<CustomBarTooltip />}
                      cursor={{ fill: "var(--bubble-bg)" }}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {hourChartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            peakHour && entry.hour === peakHour.hour
                              ? "var(--primary-color)"
                              : "var(--border-color)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {peakHour && peakHour.amount > 0 && (
                <div className="flex items-start gap-2 p-3 bg-(--primary-color)/5 rounded-2xl">
                  <Info
                    size={14}
                    className="theme-primary-text shrink-0 mt-0.5"
                  />
                  <p className="text-[10px] theme-primary-text leading-relaxed">
                    {t("reports.labels.peak_hours_footer", {
                      start: Math.max(peakHour.hour - 1, 6) + "h",
                      end: Math.min(peakHour.hour + 1, 22) + "h",
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── SECTION 3 — Répartition ─────────────────────────────────────── */}
        {pieData.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded-full" />
              <h2 className="text-xs font-black theme-text-secondary uppercase tracking-widest">
                {t("reports.labels.transaction_distribution")}
              </h2>
            </div>

            <div
              className="theme-bubble-bg rounded-[28px] border theme-border p-5 space-y-4 cursor-pointer"
              onClick={() =>
                setInfoModal({
                  title: t("reports.labels.distribution_by_type_title"),
                  body: t("reports.labels.distribution_by_type_help"),
                })
              }
            >
              <div className="flex items-center gap-4">
                <div className="w-36 h-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        startAngle={90}
                        endAngle={-270}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {pieData.map((entry, i) => {
                    const total = pieData.reduce((s, e) => s + e.value, 0);
                    const pct =
                      total > 0 ? Math.round((entry.value / total) * 100) : 0;
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-[10px] font-bold theme-text-main truncate">
                            {entry.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-black theme-text-secondary shrink-0">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border-t theme-border pt-4 flex items-center justify-between">
                <p className="text-xs theme-text-secondary">
                  {t("reports.labels.avg_amount_per_tx")}
                </p>
                <p className="text-sm font-black theme-text-main">
                  {fmtAmt(d.avgTransactionAmount)} G.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION 4 — Économies & Coûts ───────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-amber-500 rounded-full" />
            <h2 className="text-xs font-black theme-text-secondary uppercase tracking-widest">
              {t("reports.labels.savings_costs_title")}
            </h2>
          </div>

          <div className="space-y-3">
            <div
              className="theme-bubble-bg rounded-[28px] border theme-border p-5 flex items-center gap-4 cursor-pointer active:scale-[0.99] transition-all"
              onClick={() =>
                setInfoModal({
                  title: t("reports.labels.piyes_fees_paid_title"),
                  body: t("reports.labels.piyes_fees_paid_help"),
                })
              }
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Percent size={20} className="text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black theme-text-main">
                  {t("reports.labels.piyes_fees_paid_title")}
                </p>
                <p className="text-[10px] theme-text-secondary">
                  {t("reports.labels.on_sent_transactions")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-red-500">
                  {fmtAmt(d.totalFeesPaid)} G.
                </p>
              </div>
            </div>

            <div
              className="theme-bubble-bg rounded-[28px] border theme-border p-5 flex items-center gap-4 cursor-pointer active:scale-[0.99] transition-all"
              onClick={() =>
                setInfoModal({
                  title: t("reports.labels.estimated_savings_cash_title"),
                  body: t("reports.labels.estimated_savings_cash_help"),
                })
              }
            >
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
                <DollarSign size={20} className="text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black theme-text-main">
                  {t("reports.labels.estimated_savings_cash_title")}
                </p>
                <p className="text-[10px] theme-text-secondary">
                  {t("reports.labels.cash_handling_errors")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-green-500">
                  +{fmtAmt(d.totalFeesPaid * 2)} G.
                </p>
              </div>
            </div>

            <div
              className="theme-bubble-bg rounded-[28px] border theme-border p-5 flex items-center gap-4 cursor-pointer active:scale-[0.99] transition-all"
              onClick={() =>
                setInfoModal({
                  title: t("reports.labels.estimated_savings_moncash_title"),
                  body: t("reports.labels.estimated_savings_moncash_help"),
                })
              }
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Award size={20} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black theme-text-main">
                  {t("reports.labels.estimated_savings_moncash_title")}
                </p>
                <p className="text-[10px] theme-text-secondary">
                  {t("reports.labels.moncash_fees_estimated")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-blue-500">
                  +{fmtAmt(d.totalSent * 0.02)} G.
                </p>
              </div>
            </div>

            <p className="text-[9px] theme-text-secondary px-1 opacity-60">
              {t("reports.labels.estimations_disclaimer")}
            </p>
          </div>
        </section>

        {/* ── SECTION 5 — Export ──────────────────────────────────────────── */}
        <section className="space-y-4 export-hide">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-purple-500 rounded-full" />
            <h2 className="text-xs font-black theme-text-secondary uppercase tracking-widest">
              {t("reports.labels.export_report")}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting !== null}
              className="flex items-center justify-between p-4 theme-bubble-bg rounded-3xl border theme-border hover:border-(--primary-color) active:scale-95 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 theme-primary-bg text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm theme-text-main">
                    {t("reports.labels.export_pdf")}
                  </p>
                  <p className="text-[10px] theme-text-secondary">
                    {t("reports.labels.export_pdf_sub")}
                  </p>
                </div>
              </div>
              {exporting === "pdf" ? (
                <Loader2
                  size={20}
                  className="theme-text-secondary animate-spin"
                />
              ) : (
                <Download size={20} className="theme-text-secondary" />
              )}
            </button>

            <button
              onClick={() => handleExport("xlsx")}
              disabled={exporting !== null}
              className="flex items-center justify-between p-4 theme-bubble-bg rounded-3xl border theme-border hover:border-(--primary-color) active:scale-95 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-green-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Table size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm theme-text-main">
                    {t("reports.labels.export_excel")}
                  </p>
                  <p className="text-[10px] theme-text-secondary">
                    {t("reports.labels.export_excel_sub")}
                  </p>
                </div>
              </div>
              {exporting === "xlsx" ? (
                <Loader2
                  size={20}
                  className="theme-text-secondary animate-spin"
                />
              ) : (
                <Download size={20} className="theme-text-secondary" />
              )}
            </button>
          </div>
        </section>

        {/* Footer */}
        <div className="pt-4 flex flex-col items-center gap-2 pb-6">
          <CheckCircle2 size={28} className="text-green-500 opacity-40" />
          <p className="text-[10px] theme-text-secondary text-center opacity-60">
            {t("reports.labels.report_generated_on")}{" "}
            {generationDate.toLocaleDateString(t("intl.locale"))}{" "}
            {t("reports.labels.at")}{" "}
            {generationDate.toLocaleTimeString(t("intl.locale"), {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* ── Modal choix de période pour export relevé ───────────────────── */}
      {showExportModal && (
        <div className="fixed inset-0 z-100 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowExportModal(false)}
          />
          <div className="relative w-full max-w-md theme-card-bg rounded-t-[40px] p-8 space-y-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black theme-text-main">
                {t("reports.labels.choose_period")}
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 theme-bubble-bg rounded-full theme-text-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Année */}
              <div className="space-y-3">
                <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                  {t("reports.labels.year")}
                </p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {exportYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => setExportYear(year)}
                      className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                        exportYear === year
                          ? "theme-primary-bg text-white shadow-lg"
                          : "theme-bubble-bg theme-text-main border theme-border"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mois */}
              <div className="space-y-3">
                <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                  {t("reports.labels.month")}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {exportMonths.map((month, index) => (
                    <button
                      key={month}
                      onClick={() => setExportMonth(index)}
                      className={`py-4 rounded-2xl text-xs font-bold transition-all ${
                        exportMonth === index
                          ? "theme-primary-bg text-white shadow-lg"
                          : "theme-bubble-bg theme-text-main border theme-border"
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format sélectionné */}
              <div className="flex items-center gap-3 p-3 theme-bubble-bg rounded-2xl border theme-border">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${exportFormat === "pdf" ? "theme-primary-bg" : "bg-green-600"}`}
                >
                  {exportFormat === "pdf" ? (
                    <FileText size={16} className="text-white" />
                  ) : (
                    <Table size={16} className="text-white" />
                  )}
                </div>
                <p className="text-xs font-bold theme-text-secondary">
                  {exportFormat === "pdf"
                    ? t("reports.labels.export_pdf_statement")
                    : t("reports.labels.export_excel_statement")}
                </p>
              </div>

              <Button
                onClick={handleGenerateStatement}
                isLoading={exporting !== null}
                variant="primary"
                fullWidth
                className="py-5 rounded-3xl font-black shadow-xl uppercase tracking-widest flex items-center justify-center gap-2"
                leftIcon={!exporting && <Download size={18} />}
              >
                {t("reports.labels.generate_statement")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
