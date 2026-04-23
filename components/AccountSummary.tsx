// components/AccountSummary.tsx

import React, { useMemo, useState, useEffect } from 'react';
import { Landmark, Target } from 'lucide-react';
import { useTranslation } from '../App';
import { User, TransactionType } from '../shared/types';
import { financeService } from '../services/financeService';
import BankIcon from './BankIcon';
import logo from '../src/assets/images/logo-piyes-ppl-wh-wh-svg.svg';

interface AccountSummaryProps {
  user: User;
  type: 'transfer' | 'deposit' | 'withdraw';
  amount: string;
  recipientName?: string;
  onAmountChange?: (newAmount: string) => void;
  isInterbankOut?: boolean; // ✅ Nouveau : pour les frais interbancaires sortants
}

const AccountSummary: React.FC<AccountSummaryProps> = ({
  user,
  type,
  amount,
  recipientName,
  onAmountChange,
  isInterbankOut = false,
}) => {
  const { t } = useTranslation();

  const [showAid, setShowAid] = useState(false);
  const [debouncedAmount, setDebouncedAmount] = useState(amount);

  // Convertir le type string en TransactionType
  const getTransactionType = (): TransactionType => {
    switch (type) {
      case 'transfer':
        return TransactionType.TRANSFER;
      case 'deposit':
        return TransactionType.DEPOSIT;
      case 'withdraw':
        return TransactionType.WITHDRAW;
      default:
        return TransactionType.TRANSFER;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(amount);
    }, 1000);
    return () => clearTimeout(timer);
  }, [amount]);

  useEffect(() => {
    if (type === 'transfer' && parseFloat(amount) > 0 && debouncedAmount === amount) {
      setShowAid(true);
    } else {
      setShowAid(false);
    }
  }, [amount, debouncedAmount, type]);

  const numericAmount = parseFloat(amount) || 0;
  const txType = getTransactionType();

  // ✅ Calcul des frais avec le contexte interbancaire
  const feeCalculation = useMemo(() => {
    return financeService.calculateFees(numericAmount, txType, { isInterbankOut });
  }, [numericAmount, txType, isInterbankOut]);

  const {
    transferFeeVal,
    serviceFeeVal,
    netAmount,
    transferPercent,
    servicePercent,
    totalPercent,
    hasFees,
  } = feeCalculation;

  const getDynamicContent = () => {
    const formattedNet = netAmount.toLocaleString('fr-HT');
    const currency = t('currency.symbol');

    switch (type) {
      case 'transfer':
        return {
          label: "LE DESTINATAIRE REÇOIT",
          value: `${currency} ${formattedNet}`,
        };
      case 'withdraw':
        return {
          label: "VOUS RECEVREZ",
          subLabel: "DE VOTRE AGENT",
          value: `${currency} ${formattedNet}`,
        };
      case 'deposit':
        return {
          label: "VOUS RECEVREZ",
          value: `${currency} ${formattedNet}`,
        };
      default:
        return { label: '', value: '' };
    }
  };

  const content = getDynamicContent();

  const handleAidClick = () => {
    if (!onAmountChange) return;
    const calculation = financeService.calculateFees(numericAmount, txType, { isInterbankOut });
    const totalFeeRate = (calculation.transferPercent + calculation.servicePercent) / 100;
    const grossAmount = numericAmount / (1 - totalFeeRate);
    onAmountChange(grossAmount.toFixed(2));
    setShowAid(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
          {t('deposit.select_account')}
        </h3>
        {showAid && onAmountChange && (
          <button
            onClick={handleAidClick}
            className="text-[10px] font-black theme-primary-text uppercase tracking-tight animate-in slide-in-from-right flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-lg"
          >
            <Target size={12} />
            {t('transfer.net_amount_aid', { name: recipientName || 'Destinataire', amount: numericAmount })}
          </button>
        )}
      </div>

      <div className="p-5 theme-bubble-bg border-2 border-purple-100 dark:border-purple-900/30 rounded-[28px] space-y-4 shadow-sm">
        {/* Account Header */}
        <div className="flex items-center gap-4">
          <BankIcon
            logoUrl={logo}
            logoText="P"
            color="#830AD1"
            size="lg"
            className="shadow-sm border theme-border"
            id="piyes"
          />
          <div>
            <p className="font-black theme-text-main text-sm">{t('accounts.piyes_current')}</p>
            <p className="text-[11px] theme-text-secondary font-medium">
              {t('deposit.current_balance', {
                amount: user.balance.toLocaleString('fr-HT'),
                currency: t('currency.symbol'),
              })}
            </p>
          </div>
        </div>

        {/* Fees Breakdown - Only visible if amount > 0 */}
        {numericAmount > 0 && (
          <div className="pt-4 border-t theme-border space-y-3">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider theme-text-secondary opacity-60">
              <span>
                {t('account_summary.fees_transfer')} ({transferPercent}%)
              </span>
              <span>
                {transferFeeVal.toLocaleString('fr-HT')} {t('currency.symbol')}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider theme-text-secondary opacity-60">
              <span>
                {t('account_summary.fees_service')} ({servicePercent}%)
              </span>
              <span>
                {serviceFeeVal.toLocaleString('fr-HT')} {t('currency.symbol')}
              </span>
            </div>

            <div className="pt-3 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-black theme-primary-text tracking-tighter">
                  {content.label}
                </p>
                {content.subLabel && (
                  <p className="text-[8px] font-bold theme-primary-text opacity-60">
                    {content.subLabel}
                  </p>
                )}
              </div>
              <p className="text-2xl font-black theme-primary-text tracking-tight">
                {content.value}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSummary;