
import { TransactionType } from '../shared/types';

export interface FeeConfig {
  transferFee: number; // percentage as decimal (e.g. 0.01 for 1%)
  serviceFee: number;  // percentage as decimal (e.g. 0.02 for 2%)
}

export interface CountryRate {
  id: string;
  nameKey: string; // Translation key path
  currency: string;
  flag: string;
  rate: number; // Rate relative to HTG
}

class FinanceService {
  // --- CONFIGURATION ---
  
  // Default fee rules for domestic operations
  private readonly DEFAULT_FEES: Record<string, FeeConfig> = {
    transfer: { transferFee: 0.01, serviceFee: 0.02 },
    deposit:  { transferFee: 0.00, serviceFee: 0.00 }, // Usually free
    withdraw: { transferFee: 0.01, serviceFee: 0.01 },
  };

  // International Exchange Rates configuration
  private readonly COUNTRIES: CountryRate[] = [
    { id: 'us', nameKey: 'intl.countries.us', currency: 'USD', flag: 'https://flagcdn.com/w80/us.png', rate: 132 },
    { id: 'ca', nameKey: 'intl.countries.ca', currency: 'CAD', flag: 'https://flagcdn.com/w80/ca.png', rate: 96 },
    { id: 'fr', nameKey: 'intl.countries.fr', currency: 'EUR', flag: 'https://flagcdn.com/w80/fr.png', rate: 141 },
    { id: 'do', nameKey: 'intl.countries.do', currency: 'DOP', flag: 'https://flagcdn.com/w80/do.png', rate: 2.2 },
    { id: 'br', nameKey: 'intl.countries.br', currency: 'BRL', flag: 'https://flagcdn.com/w80/br.png', rate: 26 },
    { id: 'cl', nameKey: 'intl.countries.cl', currency: 'CLP', flag: 'https://flagcdn.com/w80/cl.png', rate: 0.14 },
  ];

  // --- METHODS ---

  getFeeConfig(type: 'transfer' | 'deposit' | 'withdraw'): FeeConfig {
    return this.DEFAULT_FEES[type] || this.DEFAULT_FEES.transfer;
  }

  calculateFees(amount: number, type: 'transfer' | 'deposit' | 'withdraw') {
    const config = this.getFeeConfig(type);
    const transferFeeVal = amount * config.transferFee;
    const serviceFeeVal = amount * config.serviceFee;
    const netAmount = amount - transferFeeVal - serviceFeeVal;

    return {
      transferFeeVal,
      serviceFeeVal,
      netAmount,
      transferPercent: config.transferFee * 100,
      servicePercent: config.serviceFee * 100
    };
  }

  getInternationalCountries(): CountryRate[] {
    return this.COUNTRIES;
  }

  calculateIntlConversion(amountHtg: number, countryId: string) {
    const country = this.COUNTRIES.find(c => c.id === countryId);
    if (!country) return { received: 0, fees: 0 };

    const fees = amountHtg * 0.01; // Standard 1% international fee
    const finalHtg = amountHtg - fees;
    const received = finalHtg / country.rate;

    return {
      received,
      fees,
      rate: country.rate,
      currency: country.currency
    };
  }

  generateTransactionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const prefix = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const suffix = Array.from({ length: 6 }, () => nums[Math.floor(Math.random() * nums.length)]).join('');
    return `${prefix}-${suffix}`;
  }
}

export const financeService = new FinanceService();
