// hooks/useRealtimeBalance.ts

import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';

export const useRealtimeBalance = (
    userId: string | null,
    onBalanceUpdate: (newBalance: number) => void
) => {
    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (!userId) return;

        console.log('[RealtimeBalance] Setting up listener for user:', userId);

        const channel = supabase
            .channel(`user-balance:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'User',
                    filter: `id=eq.${userId}`,
                },
                (payload) => {
                    const newBalance = payload.new as { balance: number };
                    console.log('[RealtimeBalance] Balance updated:', newBalance.balance);
                    onBalanceUpdate(newBalance.balance / 100);
                }
            )
            .subscribe((status) => {
                console.log('[RealtimeBalance] Status:', status);
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }
        };
    }, [userId, onBalanceUpdate]);
};