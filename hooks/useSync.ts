// hooks/useSync.ts -> C:\Users\mmarc\Documents\Antigravity\piyes-wallet-frontend\hooks\useSync.ts

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/apiService';
import { cacheService } from '../services/cacheService';
import { SyncResponse } from '../shared/types';

export const useSync = () => {
  const [data, setData] = useState<SyncResponse | null>(() => cacheService.get('sync'));
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // fetch avec option fresh : invalide le cache avant de fetch
  const fetchSync = useCallback(async (background = false, fresh = false) => {
    const token = localStorage.getItem('piyes-auth-token');
    if (!token) {
      setLoading(false);
      return;
    }

    if (!background) setLoading(true);
    else setIsRefreshing(true);

    try {
      let response: SyncResponse;
      if (fresh) {
        // Invalider le cache et forcer un vrai appel réseau
        response = await api.syncFresh();
      } else {
        response = await api.sync();
      }
      setData(response);
      setError(null);
    } catch (e) {
      setError('Erreur de synchronisation');
      // Garder les données du cache si disponibles
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Sync initial (utilise le cache si disponible)
    fetchSync(!!data, false);

    // Sync automatique toutes les 60 secondes (background, utilise cache TTL)
    const interval = setInterval(() => fetchSync(true, false), 1000 * 60);
    return () => clearInterval(interval);
  }, [fetchSync]);

  return {
    data,
    loading,
    error,
    isRefreshing,
    // refresh() : force un vrai fetch réseau, invalide le cache
    refresh: () => fetchSync(true, true),
    invalidate: () => cacheService.invalidate('sync')
  };
};