// services/notificationService.ts

import { TransactionType } from "../shared/types";
import { http } from "./httpClient";

export interface Notification {
  id: string;
  type:
  | "transfer_in"
  | "transfer_out"
  | "security"
  | "promo"
  | "card"
  | "request"
  | "transfer_received"
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "scheduled_request"
  | "scheduled_confirmed"
  | "scheduled_cancelled"
  | "scheduled_created"
  | "deposit_success"
  | "withdraw_success";
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  amount?: string;
  targetId?: string;
  route?: string;
  data?: {
    route?: string;
    params?: any;
    targetId?: string;
    name?: string;
    amount?: string;
  };
}

export interface NotificationPrefs {
  push: boolean;
  email: boolean;
  sms: boolean;
  security: boolean;
  promotions: boolean;
}

class NotificationService {
  private readonly PREFS_KEY = "piyes_notif_prefs";

  // --- DEVICE & PERMISSIONS ---

  async requestPermission(): Promise<"granted" | "denied" | "default"> {
    if (!("Notification" in window)) return "default";
    const permission = await window.Notification.requestPermission();
    return permission;
  }

  async getDeviceToken(): Promise<string> {
    // In a real app with FCM, this would get the actual token
    return "token_" + Math.random().toString(36).substring(7);
  }

  async registerDevice(token: string): Promise<boolean> {
    console.log("[API] Registering device token:", token);
    // In a real app, send this to backend
    return true;
  }

  // --- HISTORY MANAGEMENT ---

  async getHistory(): Promise<Notification[]> {
    try {
      const response = await http.get<any>("/user/sync");
      return response.notifications || [];
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      return [];
    }
  }

  async markAsRead(id: string): Promise<void> {
    await http.post("/user/notifications/mark-read", { id });
  }

  async markAllAsRead(): Promise<void> {
    await http.post("/user/notifications/mark-read", { all: true });
  }

  // --- PREFERENCES ---

  getPreferences(): NotificationPrefs {
    const saved = localStorage.getItem(this.PREFS_KEY);
    return saved
      ? JSON.parse(saved)
      : {
        push: true,
        email: false,
        sms: true,
        security: true,
        promotions: true,
      };
  }

  async updatePreferences(prefs: NotificationPrefs): Promise<void> {
    localStorage.setItem(this.PREFS_KEY, JSON.stringify(prefs));
    console.log("[API] Syncing notification preferences to backend...", prefs);
    await http.post("/user/privacy", { notificationPrefs: prefs });
  }
}

export const notificationService = new NotificationService();
