//services/financeService.ts

/**
 * Service de calcul des frais pour les transactions piYès
 * 
 * Règles métier :
 * - P2P (transfert entre utilisateurs piYès) : 0% de frais
 * - Recharge mobile : 0% de frais
 * - Dépôt : 0% de frais
 * - Interbank sortant (piYès → autre banque) : 0.5% de frais
 * - International : 1% de frais
 */

import { TransactionType } from '../shared/types';

export interface FeeConfig {
  transferFee: number;      // Pourcentage (ex: 0.005 pour 0.5%)
  serviceFee: number;       // Pourcentage (ex: 0.01 pour 1%)
  hasFees: boolean;         // Indique si des frais sont appliqués
  feeType?: 'interbank_out' | 'international' | 'none';
}

export interface FeeCalculationResult {
  transferFeeVal: number;
  serviceFeeVal: number;
  totalFees: number;
  netAmount: number;
  transferPercent: number;
  servicePercent: number;
  totalPercent: number;
  hasFees: boolean;
  feeType: 'interbank_out' | 'international' | 'none';
}

export interface CountryRate {
  id: string;
  nameKey: string;
  currency: string;
  flag: string;
  rate: number; // Taux par rapport à HTG
}

class FinanceService {
  // --- CONFIGURATION DES FRAIS ---

  // Frais standard par type d'opération
  private readonly FEE_RULES = {
    // P2P piYès → piYès : 0% de frais
    p2p: { transferFee: 0, serviceFee: 0, feeType: 'none' as const },

    // Recharge mobile : 0% de frais
    recharge: { transferFee: 0, serviceFee: 0, feeType: 'none' as const },

    // Dépôt : 0% de frais
    deposit: { transferFee: 0, serviceFee: 0, feeType: 'none' as const },

    // Retrait : 0% (on pourrait en mettre plus tard)
    withdraw: { transferFee: 0, serviceFee: 0, feeType: 'none' as const },

    // Interbank sortant (piYès → autre banque) : 0.5% de frais
    interbank_out: { transferFee: 0.005, serviceFee: 0, feeType: 'interbank_out' as const },

    // International : 1% de frais
    international: { transferFee: 0, serviceFee: 0.01, feeType: 'international' as const },
  };

  // Configuration par défaut (fallback)
  private readonly DEFAULT_FEES: Record<string, FeeConfig> = {
    transfer: { transferFee: 0, serviceFee: 0, hasFees: false, feeType: 'none' },
    deposit: { transferFee: 0, serviceFee: 0, hasFees: false, feeType: 'none' },
    withdraw: { transferFee: 0, serviceFee: 0, hasFees: false, feeType: 'none' },
  };

  // Taux de change internationaux
  private readonly COUNTRIES: CountryRate[] = [
    { id: 'us', nameKey: 'intl.countries.us', currency: 'USD', flag: 'https://flagcdn.com/w80/us.png', rate: 132 },
    { id: 'ca', nameKey: 'intl.countries.ca', currency: 'CAD', flag: 'https://flagcdn.com/w80/ca.png', rate: 96 },
    { id: 'fr', nameKey: 'intl.countries.fr', currency: 'EUR', flag: 'https://flagcdn.com/w80/fr.png', rate: 141 },
    { id: 'do', nameKey: 'intl.countries.do', currency: 'DOP', flag: 'https://flagcdn.com/w80/do.png', rate: 2.2 },
    { id: 'br', nameKey: 'intl.countries.br', currency: 'BRL', flag: 'https://flagcdn.com/w80/br.png', rate: 26 },
    { id: 'cl', nameKey: 'intl.countries.cl', currency: 'CLP', flag: 'https://flagcdn.com/w80/cl.png', rate: 0.14 },
  ];

  // --- MÉTHODES PUBLIQUES ---

  /**
   * Détermine le type de frais applicable selon le contexte
   */
  getFeeContext(
    transactionType: TransactionType,
    context?: {
      isInterbankOut?: boolean;    // Transfert sortant vers une autre banque
      isInternational?: boolean;   // Transfert international
      isP2P?: boolean;             // Transfert entre utilisateurs piYès
    }
  ): FeeConfig {
    // International (priorité maximale)
    if (transactionType === TransactionType.INTERNATIONAL || context?.isInternational) {
      return {
        ...this.FEE_RULES.international,
        hasFees: true,
      };
    }

    // Interbank sortant
    if (context?.isInterbankOut) {
      return {
        ...this.FEE_RULES.interbank_out,
        hasFees: true,
      };
    }

    // P2P piYès
    if (transactionType === TransactionType.TRANSFER || context?.isP2P) {
      return {
        ...this.FEE_RULES.p2p,
        hasFees: false,
      };
    }

    // Recharge mobile
    if (transactionType === TransactionType.RECHARGE) {
      return {
        ...this.FEE_RULES.recharge,
        hasFees: false,
      };
    }

    // Dépôt
    if (transactionType === TransactionType.DEPOSIT) {
      return {
        ...this.FEE_RULES.deposit,
        hasFees: false,
      };
    }

    // Retrait
    if (transactionType === TransactionType.WITHDRAW) {
      return {
        ...this.FEE_RULES.withdraw,
        hasFees: false,
      };
    }

    // Fallback
    return {
      transferFee: 0,
      serviceFee: 0,
      hasFees: false,
      feeType: 'none',
    };
  }

  /**
   * Calcule les frais pour une transaction
   */
  calculateFees(
    amount: number,
    transactionType: TransactionType,
    context?: {
      isInterbankOut?: boolean;
      isInternational?: boolean;
      isP2P?: boolean;
    }
  ): FeeCalculationResult {
    const config = this.getFeeContext(transactionType, context);

    const transferFeeVal = amount * config.transferFee;
    const serviceFeeVal = amount * config.serviceFee;
    const totalFees = transferFeeVal + serviceFeeVal;
    const netAmount = amount - totalFees;

    return {
      transferFeeVal,
      serviceFeeVal,
      totalFees,
      netAmount,
      transferPercent: config.transferFee * 100,
      servicePercent: config.serviceFee * 100,
      totalPercent: (config.transferFee + config.serviceFee) * 100,
      hasFees: config.hasFees,
      feeType: config.feeType || 'none',
    };
  }

  /**
   * Retourne le texte marketing pour l'affichage des frais sur le reçu
   */
  getFeeDisplayText(feeCalculation: FeeCalculationResult, language: 'fr' | 'ht' = 'fr'): string {
    if (!feeCalculation.hasFees) {
      const freeMessages = [
        "🎉 Aucun frais appliqué ! Avec piYès, l'argent circule librement.",
        "✨ Transfert gratuit — piYès ne prend rien sur cette opération.",
        "💜 Zéro frais. C'est ça, le transfert d'argent nouvelle génération."
      ];
      return freeMessages[Math.floor(Math.random() * freeMessages.length)];
    }

    const totalPercent = feeCalculation.totalPercent;
    const feeType = feeCalculation.feeType;

    if (feeType === 'interbank_out') {
      return `🔹 Seulement ${totalPercent}% de frais pour ce transfert interbancaire. Avec piYès, vous économisez par rapport aux banques traditionnelles !`;
    }

    if (feeType === 'international') {
      return `🌍 Frais internationaux : seulement ${totalPercent}%. piYès vous offre le meilleur taux du marché.`;
    }

    return `📊 Frais de ${totalPercent}% appliqués. piYès reste toujours plus avantageux qu'ailleurs.`;
  }

  /**
   * Récupère la configuration des frais pour un type donné
   */
  getFeeConfig(type: 'transfer' | 'deposit' | 'withdraw'): FeeConfig {
    return this.DEFAULT_FEES[type] || this.DEFAULT_FEES.transfer;
  }

  /**
   * Retourne la liste des pays disponibles pour l'international
   */
  getInternationalCountries(): CountryRate[] {
    return this.COUNTRIES;
  }

  /**
   * Calcule la conversion internationale
   */
  calculateIntlConversion(amountHtg: number, countryId: string) {
    const country = this.COUNTRIES.find(c => c.id === countryId);
    if (!country) return { received: 0, fees: 0, rate: 0, currency: 'HTG' };

    const feeConfig = this.FEE_RULES.international;
    const fees = amountHtg * feeConfig.serviceFee;
    const finalHtg = amountHtg - fees;
    const received = finalHtg / country.rate;

    return {
      received,
      fees,
      rate: country.rate,
      currency: country.currency,
    };
  }

  /**
   * Génère un code de transaction unique
   */
  generateTransactionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const prefix = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const suffix = Array.from({ length: 6 }, () => nums[Math.floor(Math.random() * nums.length)]).join('');
    return `${prefix}-${suffix}`;
  }
}

export const financeService = new FinanceService();