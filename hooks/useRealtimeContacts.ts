// hooks/useRealtimeContacts.ts
import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { cacheService } from '../services/cacheService';

export const useRealtimeContacts = (userId: string | null) => {
    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`contacts:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'Contact',
                    filter: `userId=eq.${userId}`,
                },
                () => {
                    console.log('[RealtimeContacts] Contact changed, broadcasting event');
                    cacheService.invalidate('contacts');
                    window.dispatchEvent(new CustomEvent('piyes:contacts_updated'));
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }
        };
    }, [userId]);
};