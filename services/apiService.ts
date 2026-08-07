// services/apiService.ts
import {
  User,
  Transaction,
  TransactionType,
  TransactionRole,
  Contact,
  Key,
  Receipt,
  AuthResponse,
  Card,
  CardType,
  CardStatus,
  Account,
  SyncResponse,
  ExternalBank,
  ScheduledPayment,
  ReminderSlot,
} from "../shared/types";
import { cardService } from "./cardService";
import { externalBankService } from "./externalBankService";
import { financeService } from "./financeService";
import { notificationService } from "./notificationService";
import { http } from "./httpClient";
import { cacheService } from "./cacheService";

/**
 * PiyesApiService
 * NOTE: Actuellement en mode simulation avec delay().
 * Pour passer en prod, remplacez les retours par: return http.get/post(...)
 */
class PiyesApiService {
  // --- EXTERNAL BANKS MANAGEMENT  - --

  async getAvailableBanks(): Promise<ExternalBank[]> {
    return externalBankService.getAvailableBanks();
  }

  async linkExternalBank(
    bankId: string,
    credentials: Record<string, string>,
  ): Promise<Account> {
    return externalBankService.linkBank({ bankId, credentials });
  }

  async unlinkExternalBank(accountId: string): Promise<boolean> {
    const response = await http.delete<{ success: boolean }>(
      `/banks/${accountId}`,
    );
    return response.success;
  }

  async getExternalBankTransactions(
    accountId: string,
    params: any,
  ): Promise<Transaction[]> {
    const query = new URLSearchParams(params as any).toString();
    return http.get<Transaction[]>(`/banks/${accountId}/transactions?${query}`);
  }

  // --- AUTH & SYNC ---
  async sync(): Promise<SyncResponse> {
    const cached = cacheService.get("sync");
    if (cached) return cached;
    const data = await http.get<SyncResponse>("/user/sync");
    // TTL réduit à 30s pour que le solde se mette à jour rapidement
    cacheService.set("sync", data, 1000 * 30);
    return data;
  }

  // Forcer un sync frais (après transfert, etc.)
  async syncFresh(): Promise<SyncResponse> {
    cacheService.invalidate("sync");
    const data = await http.get<SyncResponse>("/user/sync");
    cacheService.set("sync", data);
    return data;
  }

  // --- CONTACTS ---
  async getContacts(): Promise<Contact[]> {
    const cached = cacheService.get("contacts");
    if (cached) return cached;
    const data = await http.get<Contact[]>("/contacts");
    cacheService.set("contacts", data);
    return data;
  }

  // Forcer refresh contacts (après ajout/suppression)
  async getContactsFresh(): Promise<Contact[]> {
    cacheService.invalidate("contacts");
    const data = await http.get<Contact[]>("/contacts");
    cacheService.set("contacts", data);
    return data;
  }

  // --- ACCOUNT & TRANSACTIONS ---
  async getHistory(
    params: {
      limit?: number;
      offset?: number;
      type?: string;
      accountId?: string;
      counterpartyName?: string;
    } = {},
  ): Promise<Transaction[]> {
    if (params.accountId) {
      const accounts = await this.getAccounts();
      const account = accounts.find((a) => a.id === params.accountId);
      if (account && account.provider !== "piyes") {
        return this.getExternalBankTransactions(params.accountId, params);
      }
    }

    // Cache interactions par contact (counterpartyName)
    if (params.counterpartyName && !params.offset) {
      const cacheKey = `interactions_${params.counterpartyName}`;
      const cached = cacheService.get(cacheKey);
      if (cached) return cached;
      try {
        const query = new URLSearchParams(params as any).toString();
        const data = await http.get<Transaction[]>(`/transactions?${query}`);
        cacheService.set(cacheKey, data, 1000 * 60 * 10);
        return data;
      } catch (e: any) {
        // Return stale cache on network error
        if (e?.status === 0 || e?.data?.error?.code === "NETWORK_TIMEOUT") {
          const stale = cacheService.get(cacheKey);
          if (stale) return stale;
        }
        throw e;
      }
    }

    const hasFilters = params.counterpartyName || (params.type && params.type !== "all");

    if (!hasFilters) {
      const cacheKey = `history_${params.limit || 50}_${params.offset || 0}`;
      const cached = cacheService.get(cacheKey);
      if (cached) {
        console.log(`[CACHE] History (offset ${params.offset || 0}) loaded from cache`);
        return cached;
      }
      try {
        const query = new URLSearchParams(params as any).toString();
        const data = await http.get<Transaction[]>(`/transactions?${query}`);
        cacheService.set(cacheKey, data, 1000 * 60 * 5);
        return data;
      } catch (e: any) {
        if (e?.status === 0 || e?.data?.error?.code === "NETWORK_TIMEOUT") {
          const stale = cacheService.get(cacheKey);
          if (stale) return stale;
        }
        throw e;
      }
    }

    // Has filters — no cache fallback
    const query = new URLSearchParams(params as any).toString();
    return http.get<Transaction[]>(`/transactions?${query}`);
  }

  async login(
    credentials: any,
  ): Promise<AuthResponse & { mfaRequired?: boolean; requestId?: string }> {
    const response = await http.post<
      AuthResponse & { mfaRequired?: boolean; requestId?: string }
    >("/auth/login", credentials);
    if (response.token && !response.mfaRequired) {
      localStorage.setItem("piyes-auth-token", response.token);
      localStorage.setItem("piyes-user", JSON.stringify(response.user));
    }
    return response;
  }

  async verifySessionOtp(
    requestId: string,
    code: string,
  ): Promise<AuthResponse> {
    const response = await http.post<AuthResponse>("/auth/verify-session-otp", {
      requestId,
      code,
    });
    if (response.token) {
      localStorage.setItem("piyes-auth-token", response.token);
      localStorage.setItem("piyes-user", JSON.stringify(response.user));
    }
    return response;
  }

  async signup(data: any): Promise<AuthResponse> {
    const response = await http.post<AuthResponse>("/auth/signup", data);
    if (response.token) {
      localStorage.setItem("piyes-auth-token", response.token);
      localStorage.setItem("piyes-user", JSON.stringify(response.user));
    }
    return response;
  }

  async getAccounts(): Promise<Account[]> {
    const sync = await this.sync();
    return sync.accounts;
  }

  async getAgents(): Promise<any[]> {
    return [
      {
        id: "a1",
        name: "Agent piYès - Delmas 33",
        type: "agent",
        distance: "0.5 km",
        address: "Delmas 33, Port-au-Prince",
        status: "open",
      },
      {
        id: "a2",
        name: "Point ATM - Pétion-Ville",
        type: "atm",
        distance: "1.2 km",
        address: "Place Boyer, Pétion-Ville",
        status: "open",
      },
      {
        id: "a3",
        name: "Boutique Sarah (Agent)",
        type: "agent",
        distance: "2.1 km",
        address: "Route de Frères",
        status: "closed",
      },
      {
        id: "a4",
        name: "Agent piYès - Centre-Ville",
        type: "agent",
        distance: "3.5 km",
        address: "Rue Pavée",
        status: "open",
      },
    ];
  }

  async setupPin(pin: string): Promise<boolean> {
    return http.post<boolean>("/user/pin", { pin });
  }

  async verifyPin(pin: string): Promise<boolean> {
    return http.post<boolean>("/user/pin/verify", { pin });
  }

  async socialLogin(provider: "google" | "apple"): Promise<AuthResponse> {
    throw new Error("Social login not implemented");
  }

  // --- SECURITY & SESSIONS ---
  async getSessions(): Promise<any[]> {
    return [
      {
        id: "s1",
        device: "iPhone 15 Pro",
        location: "Pétion-Ville, HT",
        lastActive: "Maintenant",
        isCurrent: true,
      },
      {
        id: "s2",
        device: 'MacBook Pro 16"',
        location: "Delmas, HT",
        lastActive: "Il y a 2 heures",
        isCurrent: false,
      },
    ];
  }

  async deleteSession(sessionId: string): Promise<void> {
    // Implement delete session endpoint if needed
  }

  async disableMfa(): Promise<boolean> {
    return http.post<boolean>("/user/mfa/disable", {});
  }

  async enableMfa(): Promise<boolean> {
    return http.post<boolean>("/user/mfa/enable", {});
  }

  async setupTotp(): Promise<any> {
    return http.get<any>("/user/mfa/totp/setup");
  }

  async verifyTotp(code: string): Promise<boolean> {
    return http.post<boolean>("/user/mfa/totp/verify", { code });
  }

  // --- KEYS ---
  // Fusionner clés primaires et secondaires
  async getKeys(): Promise<Key[]> {
    // Forcer un sync frais pour garantir des primaryKeys à jour
    const sync = await this.syncFresh();
    const primaryKeys: Key[] = (sync.user as any).primaryKeys?.map((k: any) => ({
      id: `primary_${k.type}_${k.value}`,
      type: k.type,
      value: k.value,
      isVerified: true,
      isPrimary: true,
      createdAt: new Date().toISOString(),
    })) || [];
    const secondaryKeys: Key[] = (sync.user.secondaryKeys || []).map((k: any) => ({
      ...k,
      isPrimary: false,
    }));
    return [...primaryKeys, ...secondaryKeys];
  }

  async deleteKey(id: string): Promise<boolean> {
    return http.delete<boolean>(`/user/keys/${id}`);
  }

  async createKey(type: string, value: string): Promise<Key> {
    return http.post<Key>("/user/keys", { type, value });
  }

  async checkTagAvailability(tag: string): Promise<boolean> {
    const res = await http.get<{ available: boolean }>(
      `/user/keys/check-tag?tag=${encodeURIComponent(tag)}`,
    );
    return res.available;
  }

  async verifySecondaryKey(keyId: string, code: string): Promise<boolean> {
    return http.post<boolean>(`/user/keys/${keyId}/verify`, { code });
  }

  // --- OTP ---
  async requestOtp(target: string, channel: "sms" | "email"): Promise<boolean> {
    return http.post<boolean>("/auth/otp/request", {
      contact: target,
      channel,
    });
  }

  async forgotPassword(identifier: string): Promise<boolean> {
    return http.post<boolean>("/auth/forgot-password", { identifier });
  }

  async resetPassword(
    identifier: string,
    code: string,
    newPassword: string,
  ): Promise<{
    success: boolean;
    message: string;
    user?: User;
    token?: string;
  }> {
    return http.post<{
      success: boolean;
      message: string;
      user?: User;
      token?: string;
    }>("/auth/reset-password", { identifier, code, newPassword });
  }

  async verifyOtp(requestId: string, code: string): Promise<boolean> {
    return http.post<boolean>("/auth/otp/verify", { requestId, code });
  }

  async resendOtp(requestId: string): Promise<boolean> {
    return http.post<boolean>("/auth/otp/resend", { requestId });
  }

  // --- CARDS ---
  async getCards(): Promise<Card[]> {
    return cardService.getCards();
  }

  async getCardTransactions(cardId: string): Promise<Transaction[]> {
    return this.getHistory();
  }

  async toggleCardFreeze(cardId: string, isFrozen: boolean): Promise<boolean> {
    return cardService.freezeCard(cardId, isFrozen);
  }

  async deleteCard(cardId: string): Promise<boolean> {
    return cardService.deleteCard(cardId);
  }

  async createPiyesCard(
    name: string,
    type: CardType,
    color: string,
    isTemp: boolean,
  ): Promise<Card> {
    return cardService.createVirtualCard(name, isTemp);
  }

  // --- ADVANCED & UTILS ---
  async getHealth(): Promise<any> {
    return { status: "healthy", version: "1.2.0", uptime: "15d 4h 22m" };
  }

  async decryptId(id: string): Promise<string> {
    return http.post<string>("/utils/decrypt", { id });
  }

  async verifyExternalId(id: string): Promise<any> {
    return http.get<any>(`/transactions/verify/${id}`);
  }

  async getReportSummary(period: string): Promise<any> {
    // Si period contient déjà des paramètres (custom), passer tel quel
    if (period.startsWith("custom")) {
      return http.get<any>(`/transactions/reports?period=${period}`);
    }
    return http.get<any>(
      `/transactions/reports?period=${encodeURIComponent(period)}`,
    );
  }
  async cancelWithdrawal(requestId: string): Promise<boolean> {
    return http.post<boolean>(`/transactions/withdraw/${requestId}/cancel`, {});
  }

  async internationalTransfer(params: {
    country: string;
    amount: number;
    recipientName: string;
    method?: string;
    methodInfo?: string;
    currency?: string;
    amountForeign?: number;
    exchangeRate?: number;
    note?: string;
  }): Promise<any> {
    return http.post<any>("/transactions/international", params);
  }

  async interBankTransfer(params: {
    sourceId: string;
    destId: string;
    amount: number;
    note?: string;
    pin?: string;
  }): Promise<any> {
    return http.post<any>("/transactions/inter-bank-transfer", params);
  }

  async logoutAllSessions(): Promise<void> {
    await http.post("/auth/logout-all", {});
    localStorage.clear();
    cacheService.clearSensitiveData();
  }

  // --- DEMO MODE ---
  async demoStart(sessionName: "auto" | "preferred", preferredName?: string): Promise<AuthResponse> {
    const response = await http.post<AuthResponse>("/auth/demo/start", {
      sessionName,
      preferredName: sessionName === "preferred" ? preferredName : undefined,
    });
    if (response.token) {
      localStorage.setItem("piyes-auth-token", response.token);
      localStorage.setItem("piyes-user", JSON.stringify(response.user));
    }
    return response;
  }

  async deleteAccount(): Promise<void> {
    await http.delete("/user/delete");
    localStorage.clear();
    cacheService.clearSensitiveData();
  }

  // Résoudre un destinataire par tag/phone/email/randomKey avant transfert (pre-check permission)
  async resolveRecipient(
    key: string,
  ): Promise<{
    id: string;
    name: string;
    tag?: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
  } | null> {
    try {
      return await http.get<any>(
        `/transactions/resolve/${encodeURIComponent(key)}`,
      );
    } catch (e: any) {
      // 404 = introuvable, 403 = permission refusée → renvoyer null avec le code d'erreur
      throw e;
    }
  }

  async getReceipt(id: string, type: string, role: string): Promise<Receipt> {
    return http.get<Receipt>(`/transactions/receipts/${id}`);
  }

  async transfer(
    amount: number,
    contactId: string,
    description?: string,
    pin?: string,
    schedulerId?: string,
  ): Promise<any> {
    return http.post<any>("/transactions/transfer", {
      amount,
      contactId,
      description,
      pin,
      schedulerId,
    });
  }

  async deposit(amount: number, accountId: string, pin?: string): Promise<any> {
    return http.post<any>("/transactions/deposit", { amount, accountId, pin });
  }

  async withdraw(
    amount: number,
    accountId: string,
    pin?: string,
  ): Promise<any> {
    return http.post<any>("/transactions/withdraw", { amount, accountId, pin });
  }

  async recharge(params: {
    phoneNumber: string;
    amount: number;
    operatorId: string;
    accountId: string;
    pin?: string;
  }): Promise<any> {
    return http.post<any>("/transactions/recharge", params);
  }

  async requestPayment(params: {
    amount: number;
    payer?: string;
    description?: string;
    key?: string;
  }): Promise<any> {
    return http.post<any>("/transactions/request", params);
  }

  async schedulePayment(params: {
    amount: number;
    counterparty: string;
    dueDate: string;
    title?: string;
    type: "incoming" | "outgoing";
    frequency: "once" | "weekly" | "monthly";
  }): Promise<any> {
    return http.post<any>("/transactions/schedule", params);
  }

  async payWithQR(qrData: any, pin: string): Promise<any> {
    return http.post<any>("/transactions/scan", { qrData, pin });
  }

  async saveContact(contact: Partial<Contact>): Promise<Contact> {
    const response = await http.post<Contact[]>("/contacts/sync", {
      contacts: [contact],
    });
    return response[0];
  }

  async syncContacts(contacts: any[]): Promise<Contact[]> {
    return http.post<Contact[]>("/contacts/sync", { contacts });
  }

  async addContact(name: string, info: string): Promise<Contact> {
    // Passer 'info' tel quel — le backend détecte le type (tag, email, phone, randomKey)
    const response = await http.post<Contact[]>("/contacts/sync", {
      contacts: [{ name, info }],
    });
    return response[0];
  }

  async deleteContact(id: string): Promise<boolean> {
    return http.delete<boolean>(`/contacts/${id}`);
  }

  async updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
    // Invalider le cache contacts après modification
    cacheService.invalidate("contacts");
    return http.patch<Contact>(`/contacts/${id}`, data);
  }

  // Modifier un contact existant (nom, clés)
  async editContact(
    id: string,
    data: {
      name?: string;
      tag?: string;
      phone?: string;
      email?: string;
      randomKey?: string;
    },
  ): Promise<Contact & { _isExistingUser?: boolean }> {
    cacheService.invalidate("contacts");
    return http.patch<any>(`/contacts/${id}`, data);
  }

  // --- SCHEDULER ---
  async getScheduledPayments(): Promise<ScheduledPayment[]> {
    const cached = cacheService.get("scheduler");
    if (cached) return cached;
    try {
      const data = await http.get<ScheduledPayment[]>("/scheduler");
      cacheService.set("scheduler", data, 1000 * 60 * 5);
      return data;
    } catch (e: any) {
      if (e?.status === 0 || e?.data?.error?.code === "NETWORK_TIMEOUT") {
        const stale = cacheService.get("scheduler");
        if (stale) return stale;
      }
      throw e;
    }
  }

  async getScheduledPaymentsFresh(): Promise<ScheduledPayment[]> {
    cacheService.invalidate("scheduler");
    const data = await http.get<ScheduledPayment[]>("/scheduler");
    cacheService.set("scheduler", data, 1000 * 60 * 5);
    return data;
  }

  async createScheduledPayment(data: {
    title?: string;
    payerUserId?: string;
    payerName: string;
    amount: number;
    dueDate: string;
    reminders?: any[];
  }): Promise<ScheduledPayment> {
    return http.post<ScheduledPayment>("/scheduler/create", data);
  }

  async cancelScheduledPayment(id: string): Promise<boolean> {
    return http.delete<boolean>(`/scheduler/${id}`);
  }

  async updateScheduledReminders(
    id: string,
    reminders: any[],
  ): Promise<boolean> {
    return http.patch<boolean>(`/scheduler/${id}/reminders`, { reminders });
  }

  async regenerateSchedulerQR(
    id: string,
  ): Promise<{ qrToken: string; qrExpiresAt: string }> {
    return http.post<{ qrToken: string; qrExpiresAt: string }>(
      `/scheduler/${id}/regenerate-qr`,
      {},
    );
  }

  async confirmScheduledPayment(
    qrToken: string,
  ): Promise<{ success: boolean; scheduleId: string }> {
    return http.post<{ success: boolean; scheduleId: string }>(
      "/scheduler/confirm",
      { qrToken },
    );
  }

  async getScheduleByToken(token: string): Promise<any> {
    return http.get<any>(`/scheduler/by-token/${token}`);
  }

  async checkActiveScheduleBetween(
    otherUserId: string,
  ): Promise<{ hasActiveSchedule: boolean }> {
    return http.get<{ hasActiveSchedule: boolean }>(
      `/scheduler/active-between?otherUserId=${otherUserId}`,
    );
  }

  // --- FRIENDSHIP ---
  async requestFriendship(contactUserId: string): Promise<any> {
    return http.post<any>("/friendship/request", { contactUserId });
  }

  async acceptFriendship(requesterId: string): Promise<any> {
    return http.post<any>("/friendship/accept", { requesterId });
  }

  async cancelFriendship(contactUserId: string): Promise<any> {
    return http.delete<any>(
      `/friendship/cancel?contactUserId=${contactUserId}`,
    );
  }

  async getFriendshipStatus(contactUserId: string): Promise<any> {
    return http.get<any>(`/friendship/status?with=${contactUserId}`);
  }

  // --- SERVICES & PROMOTIONS ---
  async getServices(): Promise<any[]> {
    return http.get<any[]>("/services/list");
  }

  async payService(
    providerTag: string,
    amount: number,
    description?: string,
  ): Promise<any> {
    return http.post<any>("/services/pay", {
      providerTag,
      amount,
      description,
    });
  }

  async getPromotions(): Promise<any[]> {
    return http.get<any[]>("/promotions");
  }

  // --- USER PROFILE ---
  async getUserTag(): Promise<{ tag: string }> {
    return http.get<{ tag: string }>("/user/tag");
  }

  async uploadAvatar(
    avatarUrl: string,
  ): Promise<{ success: boolean; avatarUrl: string }> {
    return http.post<{ success: boolean; avatarUrl: string }>("/user/avatar", {
      avatarUrl,
    });
  }

  async updatePrivacySettings(settings: any): Promise<boolean> {
    return http.post<boolean>("/user/privacy", settings);
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return http.post<User>("/user/profile", data);
  }

  async searchUsers(query: string): Promise<User[]> {
    return http.get<User[]>(`/user/search?q=${encodeURIComponent(query)}`);
  }

  async getPrivacySettings(): Promise<any> {
    // Already included in sync, but if needed separately:
    const sync = await this.sync();
    return sync.user.privacySettings;
  }
}

export const api = new PiyesApiService();
