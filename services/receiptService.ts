//  services/receiptService.ts

import { Receipt } from '../shared/types';
import { api } from './apiService';
import { cacheService } from './cacheService';

class ReceiptService {
  async getReceipt(id: string, type: string, role: string): Promise<Receipt> {
    // Clé de cache unique par reçu — TTL 7 jours (standard fintech)
    const cacheKey = `receipts_${id}`;

    // Vérifier le cache d'abord
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`[CACHE] Receipt ${id} loaded from cache`);
      return cached;
    }

    // Fetch depuis l'API et mettre en cache
    const receipt = await api.getReceipt(id, type, role);
    cacheService.set(cacheKey, receipt, 1000 * 60 * 60 * 24 * 7); // 7 jours
    return receipt;
  }
}

export const receiptService = new ReceiptService();