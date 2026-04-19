
import { CapitalOffer } from '../shared/types';

class CapitalService {
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getAdvanceOffers(): Promise<CapitalOffer[]> {
    await this.delay(1200);
    return [
      {
        id: 'off-1',
        type: 'advance',
        amount: 25000,
        interestRate: 0.05,
        termMonths: 3,
        monthlyPayment: 8750,
        totalRepayment: 26250,
        status: 'available'
      },
      {
        id: 'off-2',
        type: 'loan',
        amount: 150000,
        interestRate: 0.12,
        termMonths: 12,
        monthlyPayment: 14000,
        totalRepayment: 168000,
        status: 'available'
      }
    ];
  }

  async acceptAdvance(offerId: string): Promise<boolean> {
    await this.delay(2000);
    console.log(`[API] Capital Advance ${offerId} accepted. Funds disbursed.`);
    return true;
  }

  async getRepaymentSchedule(): Promise<any[]> {
    await this.delay(800);
    return [
      { date: '2025-04-15', amount: 8750, status: 'upcoming' },
      { date: '2025-05-15', amount: 8750, status: 'upcoming' },
      { date: '2025-06-15', amount: 8750, status: 'upcoming' }
    ];
  }
}

export const capitalService = new CapitalService();
