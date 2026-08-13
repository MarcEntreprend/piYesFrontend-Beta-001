// src/data/mockNotifications.ts
import type { AppNotification } from "@/types";

export const mockNotifications: AppNotification[] = [
    {
        id: "notif_001",
        userId: "usr_7f3a1c92",
        type: "transfer_received",
        title: "Argent reçu",
        body: "Jean-Baptiste Batiste vous a envoyé 1 000 HTG",
        amount: "+1 000 HTG",
        isRead: false,
        timestamp: "2026-08-12T14:30:00.000Z",
    },
    {
        id: "notif_002",
        userId: "usr_7f3a1c92",
        type: "security_alert",
        title: "Nouvelle connexion détectée",
        body: "Connexion depuis un nouvel appareil Android à Port-au-Prince",
        isRead: false,
        timestamp: "2026-08-11T20:10:00.000Z",
    },
    {
        id: "notif_003",
        userId: "usr_7f3a1c92",
        type: "promo",
        title: "Recharge sans frais",
        body: "0 frais sur vos recharges Digicel jusqu'à dimanche",
        isRead: true,
        timestamp: "2026-08-10T09:00:00.000Z",
    },
];

export const unreadNotificationsCount = mockNotifications.filter((n) => !n.isRead).length;