//pages/TransferInteractions.tsx
// cette page affiche les interactions d'un utilisateur avec un contact

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  ChevronRight,
  History as HistoryIcon,
  Download,
  Share2,
  X,
  ChevronDown,
} from "lucide-react";
import { useTranslation, useGlobalSync } from "../App";
import Button from "../components/Button";
import {
  Transaction,
  TransactionType,
  TransactionRole,
  Contact,
} from "../shared/types";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../services/apiService";

const TransferInteractions: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contactId = searchParams.get("contactId");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");
  const [contact, setContact] = useState<Contact | null>(null);

  // Monthly filter state
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth(),
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const months = [
    t("common.months_full.january"),
    t("common.months_full.february"),
    t("common.months_full.march"),
    t("common.months_full.april"),
    t("common.months_full.may"),
    t("common.months_full.june"),
    t("common.months_full.july"),
    t("common.months_full.august"),
    t("common.months_full.september"),
    t("common.months_full.october"),
    t("common.months_full.november"),
    t("common.months_full.december"),
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let contactName = "";
        if (contactId) {
          const allContacts = await api.getContacts();
          const found = allContacts.find((c) => c.id === contactId);
          if (found) {
            setContact(found);
            contactName = found.name;
          }
        }

        const history = await api.getHistory({
          ...(contactName ? { counterpartyName: contactName } : {}),
          limit: 200,
        });

        setTransactions(
          history.filter((tx) => tx.type === TransactionType.TRANSFER),
        );
      } catch (error) {
        console.error("Failed to load interactions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [contactId]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      // Si pas de contactId, pas de filtre par mois (on montre tout), sinon filtre par mois
      const matchesMonth = contactId
        ? txDate.getMonth() === selectedMonth &&
        txDate.getFullYear() === selectedYear
        : true;

      const matchesSearch =
        !searchTerm.trim() ||
        tx.counterpartyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "sent" && tx.role === TransactionRole.PAYER) ||
        (filter === "received" && tx.role === TransactionRole.RECEIVER);
      return matchesMonth && matchesSearch && matchesFilter;
    });
  }, [
    transactions,
    searchTerm,
    filter,
    selectedMonth,
    selectedYear,
    contactId,
  ]);

  return (
    <div className="min-h-screen theme-card-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 theme-card-bg border-b theme-border px-6 pt-12 pb-4 space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 theme-bubble-bg rounded-full theme-text-main active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black theme-text-main tracking-tight">
              {contact
                ? t("reports.labels.interactions.with_contact", {
                  name: contact.name.split(" ")[0],
                })
                : t("reports.labels.interactions.my_interactions")}
            </h1>
            {contact && (
              <p className="text-[10px] theme-text-secondary font-bold uppercase tracking-widest">
                {contact.tag || contact.phone}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-secondary opacity-50"
              size={18}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("reports.labels.interactions.search_placeholder")}
              className="w-full py-3 pl-10 pr-4 theme-bubble-bg rounded-2xl outline-none theme-text-main border theme-border focus:border-(--primary-color) transition-all text-sm font-bold"
            />
          </div>
          <button
            onClick={() => setShowMonthPicker(true)}
            className="px-4 theme-bubble-bg rounded-2xl theme-text-main border theme-border active:scale-95 transition-transform flex items-center gap-2 text-xs font-bold"
          >
            <Calendar size={18} className="theme-primary-text" />
            {months[selectedMonth].substring(0, 3)}. {selectedYear}
            <ChevronDown size={14} className="opacity-40" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {(["all", "sent", "received"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f
                  ? "theme-primary-bg text-white shadow-lg"
                  : "theme-bubble-bg theme-text-secondary border theme-border"
                }`}
            >
              {f === "all"
                ? t("reports.labels.interactions.all")
                : f === "sent"
                  ? t("reports.labels.interactions.sent")
                  : t("reports.labels.interactions.received")}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-(--primary-color) border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="space-y-4">
            {filteredTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() =>
                  navigate(`/receipt/${tx.id}?type=${tx.type}&role=${tx.role}`)
                }
                className="theme-bubble-bg p-4 rounded-3xl border theme-border flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.role === TransactionRole.PAYER
                        ? "bg-red-50 text-red-500"
                        : "bg-green-50 text-green-500"
                      }`}
                  >
                    {tx.role === TransactionRole.PAYER ? (
                      <ArrowUpRight size={24} />
                    ) : (
                      <ArrowDownLeft size={24} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold theme-text-main text-sm">
                      {tx.counterpartyName}
                    </h4>
                    <p className="text-[10px] theme-text-secondary flex items-center gap-1">
                      <Calendar size={10} />{" "}
                      {new Date(tx.date).toLocaleDateString("fr-HT", {
                        day: "numeric",
                        month: "short",
                      })}
                      {tx.description && <span> • {tx.description}</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-black text-sm ${tx.role === TransactionRole.PAYER
                        ? "theme-text-main"
                        : "text-green-600"
                      }`}
                  >
                    {tx.role === TransactionRole.PAYER ? "-" : "+"}{" "}
                    {tx.amount.toLocaleString("fr-HT")} G
                  </p>
                  <ChevronRight
                    size={14}
                    className="theme-text-secondary opacity-30 ml-auto mt-1"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4 opacity-40">
            <div className="w-20 h-20 theme-bubble-bg rounded-full flex items-center justify-center mx-auto">
              <HistoryIcon size={32} className="theme-text-secondary" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-black theme-text-main">
                {t("reports.labels.interactions.none")}
              </p>
              <p className="text-xs theme-text-secondary">
                {t("reports.labels.interactions.for_period", {
                  month: months[selectedMonth],
                  year: selectedYear,
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Month Picker Modal */}
      <AnimatePresence>
        {showMonthPicker && (
          <div className="fixed inset-0 z-100 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMonthPicker(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md theme-card-bg rounded-t-[40px] p-8 space-y-8 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black theme-text-main">
                  {t("reports.labels.interactions.period_title")}
                </h3>
                <button
                  onClick={() => setShowMonthPicker(false)}
                  className="p-2 theme-bubble-bg rounded-full theme-text-secondary"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                    {t("reports.labels.interactions.year")}
                  </p>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {years.map((year) => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${selectedYear === year
                            ? "theme-primary-bg text-white shadow-lg"
                            : "theme-bubble-bg theme-text-main border theme-border"
                          }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                    {t("reports.labels.interactions.month")}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {months.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => setSelectedMonth(index)}
                        className={`py-4 rounded-2xl text-xs font-bold transition-all ${selectedMonth === index
                            ? "theme-primary-bg text-white shadow-lg"
                            : "theme-bubble-bg theme-text-main border theme-border"
                          }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => setShowMonthPicker(false)}
                  variant="primary"
                  fullWidth
                  className="py-5 rounded-3xl font-black shadow-xl uppercase tracking-widest mt-4"
                >
                  {t("reports.labels.interactions.apply")}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransferInteractions;
