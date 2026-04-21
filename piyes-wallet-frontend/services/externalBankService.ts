
import { http } from './httpClient';
import { Account, ExternalBank, LinkBankRequest, Transaction } from '../shared/types';

/**
 * ExternalBankService
 * Gère la liaison et la synchronisation avec les banques tierces.
 */
class ExternalBankService {
  /**
   * Récupère la liste des banques disponibles pour liaison
   */
  async getAvailableBanks(): Promise<ExternalBank[]> {
    return http.get<ExternalBank[]>('/banks/available');
  }

  /**
   * Lie une nouvelle banque
   */
  async linkBank(request: LinkBankRequest): Promise<Account> {
    return http.post<Account>('/banks/link', request);
  }

  /**
   * Supprime une banque liée
   */
  async unlinkBank(accountId: string): Promise<boolean> {
    return http.delete(`/banks/${accountId}`).then(() => true);
  }

  /**
   * Récupère le solde d'une banque externe
   */
  async getBalance(accountId: string): Promise<number> {
    // In this simulation, the balance is already in the account object from sync
    // But we can have a dedicated endpoint if needed.
    return 0; 
  }

  /**
   * Récupère l'historique d'une banque externe
   * (Uniquement les transferts interbancaires avec piYès)
   */
  async getTransactions(accountId: string, params: { limit?: number, offset?: number } = {}): Promise<Transaction[]> {
    const query = new URLSearchParams(params as any).toString();
    return http.get<Transaction[]>(`/banks/${accountId}/transactions?${query}`);
  }
}

export const externalBankService = new ExternalBankService();
