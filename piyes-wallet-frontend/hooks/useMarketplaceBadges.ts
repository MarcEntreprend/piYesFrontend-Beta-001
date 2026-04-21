// hooks/useMarketplaceBadges.ts
import { useMemo } from "react";
import { messagingService } from "../services/messagingService";

// Pour l'instant, on simule avec des valeurs statiques
// Plus tard, remplacer par de vrais appels API
export const useMarketplaceBadges = () => {
  const marketplaceCount = useMemo(() => {
    // Ces valeurs viendront de la BDD plus tard
    const myAdsMessages = 2; // badge de "my_ads"
    const unreadMessages = 3; // badge de "messages"
    const dashboardPending = 0; // badge de "dashboard"
    const homeNotifications = 0; // badge de "notifications" (9+)

    // "notifications" a "9+" donc on compte comme 9
    const homeCount = homeNotifications > 9 ? 9 : homeNotifications;

    return myAdsMessages + unreadMessages + dashboardPending + homeCount;
  }, []);

  return marketplaceCount;
};
