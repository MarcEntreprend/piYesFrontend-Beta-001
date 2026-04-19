
import { Beneficiary } from '../shared/types';

class BeneficiaryService {
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getBeneficiaries(): Promise<Beneficiary[]> {
    await this.delay(500);
    return [
      { id: 'b1', name: 'Ronald Richards', bankName: 'piYès Bank', accountNumber: '12345-6', type: 'domestic', isFavorite: true, avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ronald' },
      { id: 'b2', name: 'Alice Silva', bankName: 'BUH', accountNumber: '99887-1', type: 'domestic', isFavorite: true },
      { id: 'b3', name: 'John Doe', bankName: 'Chase Bank (USA)', accountNumber: 'US76...889', type: 'international', isFavorite: false }
    ];
  }

  async addBeneficiary(data: Partial<Beneficiary>): Promise<Beneficiary> {
    await this.delay(1200);
    return {
      id: 'b-new-' + Date.now(),
      name: data.name || 'Nouveau',
      bankName: data.bankName || 'Inconnu',
      accountNumber: data.accountNumber || '00000',
      type: data.type || 'domestic',
      isFavorite: false
    };
  }

  async deleteBeneficiary(id: string): Promise<boolean> {
    await this.delay(800);
    return true;
  }
}

export const beneficiaryService = new BeneficiaryService();
