// hooks/useRealtimeHistory.ts

import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { cacheService } from '../services/cacheService';

/**
 * Hook qui écoute les nouvelles transactions et force un refresh
 * pour que l'historique s'affiche automatiquement
 */
export const useRealtimeHistory = (
    userId: string | null,
    onNewTransaction: () => void
) => {
    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (!userId) return;

        console.log('[RealtimeHistory] Setting up listener for user:', userId);

        const channel = supabase
            .channel(`transactions:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'Transaction',
                    filter: `userId=eq.${userId}`,
                },
                (payload) => {
                    console.log('[RealtimeHistory] New transaction:', payload.new);
                    // Invalider les caches mémoire et persistants
                    cacheService.clearHistoryCache();
                    const cacheKeys = [
                        'sync',
                        'history_50_0',
                        'history_20_0',
                    ];
                    cacheKeys.forEach(key => {
                        sessionStorage.removeItem(key);
                        localStorage.removeItem(key);
                    });
                    // Forcer un refresh
                    onNewTransaction();
                }
            )
            .subscribe((status) => {
                console.log('[RealtimeHistory] Status:', status);
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }
        };
    }, [userId, onNewTransaction]);
};