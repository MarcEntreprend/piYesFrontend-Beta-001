// contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification, notificationService } from '../services/notificationService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => Promise<void>;
  simulatePush: (type?: Notification['type']) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotificationContext must be used within NotificationProvider');
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getHistory();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // ✅ Vérifier si un token existe avant de charger les notifications
    const token = localStorage.getItem('piyes-auth-token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetchNotifications();

    const handleNewNotif = (e: any) => {
      const newNotif = e.detail;
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener('piyes:new_notif', handleNewNotif);
    return () => window.removeEventListener('piyes:new_notif', handleNewNotif);
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const simulatePush = (type: Notification['type'] = 'transfer_in') => {
    const mock: Notification = {
      id: Math.random().toString(),
      type,
      title: 'Nouveau message piYès',
      body: 'Ceci est une notification simulée.',
      timestamp: new Date().toISOString(),
      isRead: false,
      data: { route: '/' }
    };
    window.dispatchEvent(new CustomEvent('piyes:new_notif', { detail: mock }));
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markRead,
      markAllRead,
      refresh: fetchNotifications,
      simulatePush
    }}>
      {children}
    </NotificationContext.Provider>
  );
};