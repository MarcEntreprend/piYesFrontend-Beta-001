// services/schedulerService.ts

import { ScheduledPayment } from '../shared/types';

class SchedulerService {
  private readonly STORAGE_KEY = 'piyes-scheduled-payments';

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getScheduledPayments(): Promise<ScheduledPayment[]> {
    await this.delay(600);
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Loyer Bureau', counterparty: 'SCI Immobilier', amount: 12500, dueDate: '2025-04-01', status: 'pending', type: 'outgoing', frequency: 'monthly' },
      { id: '4', title: 'Vente Prototype', counterparty: 'Jean Marc', amount: 45000, dueDate: '2025-04-10', status: 'pending', type: 'incoming', frequency: 'once' },
    ];
  }

  async saveScheduledPayment(data: Partial<ScheduledPayment>): Promise<ScheduledPayment> {
    await this.delay(1000);
    const payments = await this.getScheduledPayments();
    const newPayment: ScheduledPayment = {
      id: Math.random().toString(36).substring(7),
      title: data.title || 'Paiement sans titre',
      counterparty: data.counterparty || 'Inconnu',
      amount: data.amount || 0,
      dueDate: data.dueDate || new Date().toISOString(),
      status: 'pending',
      type: data.type || 'outgoing',
      frequency: data.frequency || 'once'
    };
    
    const updated = [newPayment, ...payments];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    return newPayment;
  }

  async cancelScheduledPayment(id: string): Promise<boolean> {
    await this.delay(800);
    const payments = await this.getScheduledPayments();
    const updated = payments.map(p => p.id === id ? { ...p, status: 'cancelled' as const } : p);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    return true;
  }

  async updateScheduledPayment(id: string, data: Partial<ScheduledPayment>): Promise<ScheduledPayment | null> {
    await this.delay(800);
    const payments = await this.getScheduledPayments();
    const idx = payments.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const updatedPayment = { ...payments[idx], ...data };
    payments[idx] = updatedPayment;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payments));
    return updatedPayment;
  }
}

export const schedulerService = new SchedulerService();
