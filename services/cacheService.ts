// services/cacheService.ts

/**
 * CacheService gère la persistance locale des données avec TTL et un "chiffrement" léger
 * pour simuler les standards de sécurité fintech.
 */
class CacheService {
  private readonly PREFIX = 'piyes_vault_';

  // TTL par défaut par type de donnée (en millisecondes)
  private readonly TTL_CONFIG = {
    sync: 1000 * 60 * 5, // 5 minutes pour le dashboard sync
    history: 1000 * 60 * 15, // 15 minutes pour l'historique complet
    contacts: 1000 * 60 * 60 * 24, // 24 heures pour les contacts
    ads: 1000 * 60 * 10, // 10 minutes pour le marché

    scheduler: 1000 * 60 * 5,      // 5 minutes
    notifications: 1000 * 60 * 2,  // 2 minutes
    interactions: 1000 * 60 * 10,  // 10 minutes par contact
    receipts: 1000 * 60 * 60 * 24 * 7, // 7 jours — reçus consultés
  };

  /**
   * Chiffre les données (Simulation Base64 simple pour la démo, 
   * remplacerait un vrai AES-256 en prod)
   */
  private encrypt(data: any): string {
    const json = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(json)));
  }

  /**
   * Déchiffre les données
   */
  private decrypt(vault: string): any {
    try {
      const json = decodeURIComponent(escape(atob(vault)));
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  set(key: string, data: any, customTtl?: number) {
    const ttl = customTtl || (this.TTL_CONFIG as any)[key] || 1000 * 60;
    const entry = {
      payload: data,
      expiry: Date.now() + ttl,
      version: '1.2.0'
    };
    localStorage.setItem(this.PREFIX + key, this.encrypt(entry));
  }

  get(key: string): any | null {
    const vault = localStorage.getItem(this.PREFIX + key);
    if (!vault) return null;

    const entry = this.decrypt(vault);
    if (!entry) return null;

    // Vérification de l'expiration
    if (Date.now() > entry.expiry) {
      localStorage.removeItem(this.PREFIX + key);
      return null;
    }

    return entry.payload;
  }

  invalidate(key: string) {
    localStorage.removeItem(this.PREFIX + key);
  }

  clearHistoryCache() {
    const prefix = this.PREFIX + 'history_';
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    }
  }

  clearAll() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  clearSensitiveData() {
    this.clearAll();
    localStorage.removeItem('piyes-auth-token');
    localStorage.removeItem('piyes-user');
    localStorage.removeItem('piyes-avatar');
    localStorage.removeItem('piyes-app-pin');
    localStorage.removeItem('piyes-last-greeting');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_pin');
    localStorage.removeItem('cached_balances');
    localStorage.removeItem('cached_transactions');
    localStorage.removeItem('cached_banks');
    localStorage.removeItem('piyes-token');
    localStorage.removeItem('piyes-pin');
    localStorage.removeItem('piyes-is-locked');
    localStorage.removeItem('piyes-device-verified');
    localStorage.removeItem('piyes-last-activity');
    localStorage.removeItem("piyes_cleared_notifications");

    sessionStorage.clear();

    // Clear all cookies if possible (limited by httpOnly)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    console.log('Sensitive data cleared from storage.');
  }

  /**
   * Caches a static asset (e.g., logo, flag) persistently.
   */
  async cacheAsset(url: string): Promise<string> {
    const ASSET_CACHE_NAME = 'piyes-asset-cache-v1';
    try {
      const cache = await caches.open(ASSET_CACHE_NAME);
      const cachedResponse = await cache.match(url);

      if (cachedResponse) {
        return url; // Already cached
      }

      // Fetch and cache
      const response = await fetch(url, { referrerPolicy: 'no-referrer' });
      if (response.ok) {
        await cache.put(url, response.clone());
      }
      return url;
    } catch (error) {
      console.error('Failed to cache asset:', url, error);
      return url;
    }
  }

  /**
   * Refreshes all cached assets.
   */
  async refreshAssets(urls: string[]) {
    try {
      await this.clearAssetCache();
      const promises = urls.map(url => this.cacheAsset(url));
      await Promise.all(promises);
      console.log('Assets refreshed successfully.');
    } catch (error) {
      console.error('Failed to refresh assets:', error);
    }
  }

  /**
   * Clears the entire asset cache (e.g., for periodic refresh).
   */
  async clearAssetCache() {
    const ASSET_CACHE_NAME = 'piyes-asset-cache-v1';
    try {
      await caches.delete(ASSET_CACHE_NAME);
      console.log('Asset cache cleared.');
    } catch (error) {
      console.error('Failed to clear asset cache:', error);
    }
  }
}

export const cacheService = new CacheService();
