// hooks/useNotifications.ts

import { useNotificationContext } from "../contexts/NotificationContext";

/**
 * Hook pour accéder aux notifications globales.
 * Utilise le NotificationContext pour partager l'état entre tous les composants.
 */
export const useNotifications = () => {
  return useNotificationContext();
};
