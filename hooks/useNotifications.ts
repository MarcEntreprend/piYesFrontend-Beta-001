// hooks/useNotifications.ts

import { useState, useEffect, useCallback } from 'react';
import { Notification, notificationService } from '../services/notificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const data = await notificationService.getHistory();
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.isRead).length);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
    
    // In a real app, setup FCM listener here
    // For now, we simulate a "foreground" event listener
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

  // Helper for development: Simulate an incoming push
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

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    refresh: fetchNotifications,
    simulatePush
  };
};
