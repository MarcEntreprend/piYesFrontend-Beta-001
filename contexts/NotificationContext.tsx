// contexts/NotificationContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Notification, notificationService } from '../services/notificationService';
import { useTranslation } from '../App';
import { supabase } from '../services/supabaseClient';

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
  const { t } = useTranslation();

  // Référence pour suivre l'utilisateur courant (pour Realtime)
  const [userId, setUserId] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  // Récupérer l'userId depuis localStorage au montage
  useEffect(() => {
    const userStr = localStorage.getItem('piyes-user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserId(user.id);
      } catch (e) { }
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getHistory();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error(t('notifications.errors.fetch_failed'), error);
    } finally {
      setLoading(false);
    }
  }, [t]);

  //  Realtime: écoute les nouvelles notifications (UNIQUEMENT si userId présent)
  useEffect(() => {
    if (!userId) return;

    console.log('[Realtime] Setting up listener for user:', userId);

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Notification',
          filter: `userId=eq.${userId}`,
        },
        (payload) => {
          const rawNotif = payload.new as Notification;
          console.log('[Realtime] New notification received:', rawNotif);

          // 🔧 FORMATAGE : Ajouter data.route et data.targetId pour la navigation
          const formattedNotif: Notification = {
            ...rawNotif,
            data: {
              // Force la route calculée, pas celle de la BDD
              route: (
                rawNotif.type === 'transfer_received' ? '/history' :
                  rawNotif.type === 'transfer_out' ? '/history' :
                    rawNotif.type === 'deposit_success' ? '/history' :
                      rawNotif.type === 'request' ? '/request-payment' :
                        rawNotif.type === 'scheduled_request' ? '/scheduler?tab=outgoing' :
                          rawNotif.type === 'scheduled_confirmed' ? '/scheduler?tab=outgoing' :
                            rawNotif.type === 'scheduled_created' ? '/scheduler?tab=incoming' :
                              rawNotif.type === 'scheduled_cancelled' ? '/scheduler?tab=outgoing' :
                                rawNotif.type === 'FRIEND_REQUEST' ? '/contacts' :
                                  rawNotif.type === 'FRIEND_ACCEPTED' ? '/contacts' : '/'
              ),
              targetId: rawNotif.targetId || rawNotif.id,
              ...rawNotif.data,
            },
          };

          // Ajouter la notification en tête de liste
          setNotifications(prev => {
            if (prev.some(n => n.id === formattedNotif.id)) return prev;
            return [formattedNotif, ...prev];
          });
          setUnreadCount(prev => prev + 1);

          // Vibration courte
          if ('vibrate' in navigator) {
            navigator.vibrate(100);
          }

          // Émettre un événement pour les autres composants
          window.dispatchEvent(new CustomEvent('piyes:realtime_notification', {
            detail: formattedNotif
          }));
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [userId]);

  // Chargement initial des notifications
  useEffect(() => {
    const token = localStorage.getItem('piyes-auth-token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Écouter l'événement existant pour les notifs simulées ou legacy
    const handleNewNotif = (e: any) => {
      const newNotif = e.detail;
      setNotifications(prev => {
        if (prev.some(n => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
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