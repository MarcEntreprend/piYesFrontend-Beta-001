// services/receivingService.ts

import { ReceivingAccount } from '../shared/types';

class ReceivingService {
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getReceivingAccounts(): Promise<ReceivingAccount[]> {
    await this.delay(900);
    return [
      { 
        id: 'ra1', 
        currency: 'USD', 
        label: 'Balance Dollar', 
        accountNumber: '7766554433', 
        routingNumber: '123456789', 
        balance: 1250.50, 
        status: 'active' 
      },
      { 
        id: 'ra2', 
        currency: 'EUR', 
        label: 'Balance Euro', 
        accountNumber: 'FR76 1234 5678 9012', 
        swiftCode: 'PIYESFR22', 
        balance: 0, 
        status: 'pending' 
      }
    ];
  }

  async createReceivingAccount(currency: 'USD' | 'EUR' | 'DOP'): Promise<ReceivingAccount> {
    await this.delay(3000); // Simule l'ouverture d'un compte bancaire
    return {
      id: 'ra-new-' + Date.now(),
      currency,
      label: `Balance ${currency}`,
      accountNumber: Math.floor(Math.random() * 10000000000).toString(),
      balance: 0,
      status: 'active'
    };
  }
}

export const receivingService = new ReceivingService();
