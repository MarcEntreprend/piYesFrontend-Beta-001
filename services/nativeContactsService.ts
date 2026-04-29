// services/nativeContactsService.ts
// Reads native phone contacts via custom Capacitor plugin (no third-party dependency)

import { Capacitor, registerPlugin } from '@capacitor/core';

// Interface for our custom plugin
interface NativeContactsPlugin {
    getPhoneNumbers(): Promise<{
        contacts: Array<{ name: string; phone: string }>;
    }>;
}

// Register the custom plugin — matches the name in @CapacitorPlugin(name = "NativeContacts")
const NativeContactsBridge = registerPlugin<NativeContactsPlugin>('NativeContacts');

export interface NativeContact {
    id: string;
    name: string;
    phoneNumbers: string[];
    isOnApp: boolean;
    appUserId?: string;
    appUserName?: string;
    appUserTag?: string;
    appUserAvatar?: string;
    matchedPhone?: string;
}
// Cache natif lié à la session  → infini tant que l'utilisateur est connecté, et vider au logout.
const CACHE_KEY = 'piyes-native-contacts-cache';
// No TTL expiry — cache lives for the session duration
// Cleared explicitly on logout via clearNativeContactsCache()
const CACHE_TTL = 1000 * 60 * 60 * 24 * 365; // effectively permanent (1 year)

// Normalize to bare 8-digit Haitian number
const normalizePhone = (phone: string): string => {
    return phone
        .replace(/[\s\-\(\)\.]/g, '')
        .replace(/^\+509/, '')
        .replace(/^509/, '')
        .replace(/^0/, '');
};

export const getCachedNativeContacts = (): NativeContact[] | null => {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp > CACHE_TTL) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
        return parsed.contacts;
    } catch {
        return null;
    }
};

const setCachedNativeContacts = (contacts: NativeContact[]): void => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            contacts,
        }));
    } catch (e) {
        console.error('[NativeContacts] Cache write error:', e);
    }
};

export const clearNativeContactsCache = (): void => {
    localStorage.removeItem(CACHE_KEY);
};

export const getMatchedNativeContacts = async (
    onStatus?: (msg: string) => void,
    forceRefresh: boolean = false
): Promise<NativeContact[]> => {
    const log = (msg: string) => {
        console.log('[NativeContacts]', msg);
        onStatus?.(msg);
    };

    // Only works on native Android/iOS
    if (!Capacitor.isNativePlatform()) {
        log('Non-natif, contacts natifs non disponibles');
        return [];
    }

    // 1. Retourner le cache immédiatement s'il existe et qu'on ne force pas le refresh
    const cached = getCachedNativeContacts();
    if (!forceRefresh && cached && cached.length > 0) {
        log(`${cached.length} contacts depuis le cache (instantané)`);
        return cached;
    }

    try {
        log('Lecture du répertoire...');

        // Call our custom Java plugin directly
        const result = await NativeContactsBridge.getPhoneNumbers();
        const raw = result.contacts || [];

        log(`${raw.length} entrées lues`);

        if (raw.length === 0) return [];

        // Group by name, collect all numbers per contact
        const byName = new Map<string, NativeContact>();
        raw.forEach((entry, idx) => {
            const bare = normalizePhone(entry.phone);
            if (bare.length !== 8) return; // skip non-Haitian numbers

            const key = entry.name || `contact_${idx}`;
            if (!byName.has(key)) {
                byName.set(key, {
                    id: `native_${idx}`,
                    name: entry.name || 'Sans nom',
                    phoneNumbers: [],
                    isOnApp: false,
                });
            }
            const contact = byName.get(key)!;
            if (!contact.phoneNumbers.includes(bare)) {
                contact.phoneNumbers.push(bare);
            }
        });

        const normalized = [...byName.values()].filter(c => c.phoneNumbers.length > 0);
        log(`${normalized.length} contacts avec numéro haïtien`);

        // Sample for debug
        const sample = normalized.slice(0, 3).flatMap(c => c.phoneNumbers);
        log('Exemples: ' + sample.join(', '));

        // Send to backend for matching
        const allPhones = [...new Set(normalized.flatMap(c => c.phoneNumbers))];
        log(`Envoi de ${allPhones.length} numéros...`);

        const token = localStorage.getItem('piyes-auth-token');
        const baseUrl = import.meta.env.VITE_API_URL || '';

        const response = await fetch(`${baseUrl}/api/v1/user/by-phones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({ phones: allPhones }),
        });

        log(`Backend: HTTP ${response.status}`);

        if (!response.ok) {
            log(`Erreur backend ${response.status}`);
            return [];
        }

        const data = await response.json();
        const appUsers: any[] = data.users || [];
        log(`${appUsers.length} users piYès trouvés`);

        if (appUsers.length === 0) {
            log('Aucun match');
            return [];
        }

        // Build lookup: bare 8-digit → user
        const phoneToUser = new Map<string, any>();
        appUsers.forEach(u => {
            if (u.phone) {
                const bare = normalizePhone(u.phone);
                if (bare.length === 8) phoneToUser.set(bare, u);
            }
        });

        log(`Map: ${phoneToUser.size} entrées`);

        // Match contacts with piYès users
        const matched: NativeContact[] = normalized
            .map(contact => {
                const matchedPhone = contact.phoneNumbers.find(p => phoneToUser.has(p));
                if (!matchedPhone) return null;

                const user = phoneToUser.get(matchedPhone)!;
                return {
                    ...contact,
                    isOnApp: true,
                    appUserId: user.id,
                    appUserName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                    appUserTag: user.tag,
                    appUserAvatar: user.avatarUrl,
                    matchedPhone,
                };
            })
            .filter(Boolean) as NativeContact[];

        log(`${matched.length} contacts sur piYès`);

        setCachedNativeContacts(matched);
        return matched;

    } catch (error: any) {
        log('Erreur: ' + (error?.message || String(error)));
        console.error('[NativeContacts] Full error:', error);
        return [];
    }
};